from fastapi import APIRouter, HTTPException

from services import data_store

router = APIRouter(prefix="/api", tags=["countries"])


@router.get("/countries")
def get_countries():
    return {"countries": data_store.list_countries()}


@router.get("/countries/{country_code}")
def get_country(country_code: str):
    country = data_store.get_country(country_code)
    if country is None:
        raise HTTPException(status_code=404, detail=f"Unknown country code: {country_code}")
    return country
