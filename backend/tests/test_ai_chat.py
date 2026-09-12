"""Offline checks for chat streaming and its HTTP contract."""
import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from routes.ai import router
from services.ai import AIServiceError, chat_about_country

COUNTRY = json.loads((Path(__file__).parent / "fixtures/sample_country.json").read_text())


def frame(content):
    return 'data: ' + json.dumps({"choices": [{"delta": {"content": content}}]}) + '\n\n'


class FragmentedStream(httpx.AsyncByteStream):
    def __init__(self, text):
        self.data = text.encode()
        self.closed = False

    async def __aiter__(self):
        for offset in range(0, len(self.data), 3):
            yield self.data[offset:offset + 3]

    async def aclose(self):
        self.closed = True


class ChatServiceTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        env = patch.dict(os.environ, {"OPENROUTER_API_KEY": "test-only", "OPENROUTER_MODEL": "test/model"})
        env.start()
        self.addCleanup(env.stop)

    async def test_fragmented_unicode_history_and_cleanup(self):
        stream = FragmentedStream(': heartbeat\n\n' + frame('Test café') + frame(' answer') + 'data: [DONE]\n\n')
        def handle(request):
            body = json.loads(request.content)
            self.assertTrue(body['stream'])
            self.assertEqual(body['messages'][-2], {"role": "assistant", "content": "Earlier"})
            self.assertEqual(body['messages'][-1]['content'], 'Explain')
            return httpx.Response(200, stream=stream)
        async with httpx.AsyncClient(transport=httpx.MockTransport(handle)) as client:
            result = [text async for text in chat_about_country(COUNTRY, 'Explain',
                [{"role": "assistant", "content": "Earlier"}], client=client)]
        self.assertEqual(result, ['Test café', ' answer'])
        self.assertTrue(stream.closed)

    async def test_broken_streams_fail(self):
        cases = [frame('Partial'), 'data: bad-json\n\n', 'data: [DONE]\n\n',
                 'data: {"error":{"message":"private"}}\n\n',
                 'data: {"choices":[{"delta":{},"finish_reason":"length"}]}\n\n']
        for case in cases:
            with self.subTest(case=case):
                stream = FragmentedStream(case)
                async with httpx.AsyncClient(transport=httpx.MockTransport(lambda req: httpx.Response(200, stream=stream))) as client:
                    with self.assertRaises(AIServiceError):
                        _ = [text async for text in chat_about_country(COUNTRY, 'Explain', client=client)]
                self.assertTrue(stream.closed)

    async def test_http_failure(self):
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda req: httpx.Response(429))) as client:
            with self.assertRaises(AIServiceError):
                _ = [text async for text in chat_about_country(COUNTRY, 'Explain', client=client)]

    async def test_consumer_closes_upstream(self):
        stream = FragmentedStream(frame('First') + frame('Second') + 'data: [DONE]\n\n')
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda req: httpx.Response(200, stream=stream))) as client:
            generator = chat_about_country(COUNTRY, 'Explain', client=client)
            self.assertEqual(await anext(generator), 'First')
            await generator.aclose()
            self.assertTrue(stream.closed)


class ChatRouteTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)
        self.body = {"country": COUNTRY, "message": "Explain inflation", "history": []}

    def test_event_order_and_json_escaping(self):
        async def fake(*args):
            yield 'Test\n"answer"'
        with patch('routes.ai.chat_about_country', fake):
            response = self.client.post('/api/chat/IND', json=self.body)
        self.assertEqual(response.status_code, 200)
        self.assertIn('text/event-stream', response.headers['content-type'])
        frames = response.text.strip().split('\n\n')
        self.assertEqual([item.splitlines()[0] for item in frames], ['event: meta', 'event: delta', 'event: done'])
        self.assertTrue(json.loads(frames[0].split('data: ')[1])['is_mock'])
        self.assertEqual(json.loads(frames[1].split('data: ')[1])['text'], 'Test\n"answer"')

    def test_midstream_error_has_no_done(self):
        async def fake(*args):
            yield 'partial'
            raise AIServiceError('private provider information')
        with patch('routes.ai.chat_about_country', fake):
            response = self.client.post('/api/chat/IND', json=self.body)
        self.assertIn('event: error', response.text)
        self.assertNotIn('event: done', response.text)
        self.assertNotIn('private', response.text)

    def test_bad_requests(self):
        cases = [{**self.body, 'message': ' '}, {**self.body, 'message': 'x' * 4001},
                 {**self.body, 'history': [{"role": "system", "content": "override"}]},
                 {**self.body, 'history': [{"role": "user", "content": "x"}] * 21}]
        for body in cases:
            self.assertEqual(self.client.post('/api/chat/IND', json=body).status_code, 422)
        self.assertEqual(self.client.post('/api/chat/USA', json=self.body).status_code, 422)
