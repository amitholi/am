"""
Seed database with Israeli courts and case type reference data.
Run automatically on first startup.
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.court import Court
import structlog

logger = structlog.get_logger()

COURTS = [
    # Supreme Court
    {"name": "בית המשפט העליון", "name_en": "Supreme Court of Israel", "court_type": "עליון", "district": "ירושלים", "city": "ירושלים"},

    # District Courts
    {"name": "בית המשפט המחוזי ירושלים", "name_en": "Jerusalem District Court", "court_type": "מחוזי", "district": "ירושלים", "city": "ירושלים"},
    {"name": "בית המשפט המחוזי תל אביב-יפו", "name_en": "Tel Aviv District Court", "court_type": "מחוזי", "district": "תל אביב", "city": "תל אביב"},
    {"name": "בית המשפט המחוזי חיפה", "name_en": "Haifa District Court", "court_type": "מחוזי", "district": "חיפה", "city": "חיפה"},
    {"name": "בית המשפט המחוזי מרכז", "name_en": "Central District Court", "court_type": "מחוזי", "district": "מרכז", "city": "לוד"},
    {"name": "בית המשפט המחוזי באר שבע", "name_en": "Beersheba District Court", "court_type": "מחוזי", "district": "דרום", "city": "באר שבע"},
    {"name": "בית המשפט המחוזי נצרת", "name_en": "Nazareth District Court", "court_type": "מחוזי", "district": "צפון", "city": "נצרת"},

    # Magistrate Courts (Shalom)
    {"name": "בית משפט השלום ירושלים", "name_en": "Jerusalem Magistrate Court", "court_type": "שלום", "district": "ירושלים", "city": "ירושלים"},
    {"name": "בית משפט השלום תל אביב-יפו", "name_en": "Tel Aviv Magistrate Court", "court_type": "שלום", "district": "תל אביב", "city": "תל אביב"},
    {"name": "בית משפט השלום חיפה", "name_en": "Haifa Magistrate Court", "court_type": "שלום", "district": "חיפה", "city": "חיפה"},
    {"name": "בית משפט השלום פתח תקווה", "name_en": "Petah Tikva Magistrate Court", "court_type": "שלום", "district": "מרכז", "city": "פתח תקווה"},
    {"name": "בית משפט השלום ראשון לציון", "name_en": "Rishon LeZion Magistrate Court", "court_type": "שלום", "district": "מרכז", "city": "ראשון לציון"},
    {"name": "בית משפט השלום רמלה", "name_en": "Ramla Magistrate Court", "court_type": "שלום", "district": "מרכז", "city": "רמלה"},
    {"name": "בית משפט השלום נתניה", "name_en": "Netanya Magistrate Court", "court_type": "שלום", "district": "מרכז", "city": "נתניה"},
    {"name": "בית משפט השלום באר שבע", "name_en": "Beersheba Magistrate Court", "court_type": "שלום", "district": "דרום", "city": "באר שבע"},
    {"name": "בית משפט השלום אשקלון", "name_en": "Ashkelon Magistrate Court", "court_type": "שלום", "district": "דרום", "city": "אשקלון"},
    {"name": "בית משפט השלום אשדוד", "name_en": "Ashdod Magistrate Court", "court_type": "שלום", "district": "דרום", "city": "אשדוד"},
    {"name": "בית משפט השלום נצרת", "name_en": "Nazareth Magistrate Court", "court_type": "שלום", "district": "צפון", "city": "נצרת"},
    {"name": "בית משפט השלום חדרה", "name_en": "Hadera Magistrate Court", "court_type": "שלום", "district": "חיפה", "city": "חדרה"},
    {"name": "בית משפט השלום כפר סבא", "name_en": "Kfar Saba Magistrate Court", "court_type": "שלום", "district": "מרכז", "city": "כפר סבא"},
    {"name": "בית משפט השלום רחובות", "name_en": "Rehovot Magistrate Court", "court_type": "שלום", "district": "מרכז", "city": "רחובות"},
    {"name": "בית משפט השלום הרצליה", "name_en": "Herzliya Magistrate Court", "court_type": "שלום", "district": "תל אביב", "city": "הרצליה"},
    {"name": "בית משפט השלום בת ים", "name_en": "Bat Yam Magistrate Court", "court_type": "שלום", "district": "תל אביב", "city": "בת ים"},
    {"name": "בית משפט השלום עכו", "name_en": "Acre Magistrate Court", "court_type": "שלום", "district": "צפון", "city": "עכו"},
    {"name": "בית משפט השלום טבריה", "name_en": "Tiberias Magistrate Court", "court_type": "שלום", "district": "צפון", "city": "טבריה"},
    {"name": "בית משפט השלום צפת", "name_en": "Safed Magistrate Court", "court_type": "שלום", "district": "צפון", "city": "צפת"},
    {"name": "בית משפט השלום אילת", "name_en": "Eilat Magistrate Court", "court_type": "שלום", "district": "דרום", "city": "אילת"},

    # Labor Courts
    {"name": "בית הדין הארצי לעבודה", "name_en": "National Labor Court", "court_type": "עבודה", "district": "ירושלים", "city": "ירושלים"},
    {"name": "בית הדין האזורי לעבודה ירושלים", "name_en": "Jerusalem Regional Labor Court", "court_type": "עבודה", "district": "ירושלים", "city": "ירושלים"},
    {"name": "בית הדין האזורי לעבודה תל אביב", "name_en": "Tel Aviv Regional Labor Court", "court_type": "עבודה", "district": "תל אביב", "city": "תל אביב"},
    {"name": "בית הדין האזורי לעבודה חיפה", "name_en": "Haifa Regional Labor Court", "court_type": "עבודה", "district": "חיפה", "city": "חיפה"},
    {"name": "בית הדין האזורי לעבודה נצרת", "name_en": "Nazareth Regional Labor Court", "court_type": "עבודה", "district": "צפון", "city": "נצרת"},
    {"name": "בית הדין האזורי לעבודה באר שבע", "name_en": "Beersheba Regional Labor Court", "court_type": "עבודה", "district": "דרום", "city": "באר שבע"},

    # Family Courts
    {"name": "בית המשפט לענייני משפחה ירושלים", "name_en": "Jerusalem Family Court", "court_type": "משפחה", "district": "ירושלים", "city": "ירושלים"},
    {"name": "בית המשפט לענייני משפחה תל אביב", "name_en": "Tel Aviv Family Court", "court_type": "משפחה", "district": "תל אביב", "city": "תל אביב"},
    {"name": "בית המשפט לענייני משפחה חיפה", "name_en": "Haifa Family Court", "court_type": "משפחה", "district": "חיפה", "city": "חיפה"},
    {"name": "בית המשפט לענייני משפחה ראשון לציון", "name_en": "Rishon LeZion Family Court", "court_type": "משפחה", "district": "מרכז", "city": "ראשון לציון"},
    {"name": "בית המשפט לענייני משפחה נצרת", "name_en": "Nazareth Family Court", "court_type": "משפחה", "district": "צפון", "city": "נצרת"},
    {"name": "בית המשפט לענייני משפחה באר שבע", "name_en": "Beersheba Family Court", "court_type": "משפחה", "district": "דרום", "city": "באר שבע"},

    # Traffic Courts
    {"name": "בית משפט לתעבורה תל אביב", "name_en": "Tel Aviv Traffic Court", "court_type": "תעבורה", "district": "תל אביב", "city": "תל אביב"},
    {"name": "בית משפט לתעבורה ירושלים", "name_en": "Jerusalem Traffic Court", "court_type": "תעבורה", "district": "ירושלים", "city": "ירושלים"},
    {"name": "בית משפט לתעבורה חיפה", "name_en": "Haifa Traffic Court", "court_type": "תעבורה", "district": "חיפה", "city": "חיפה"},
]

CASE_TYPES = [
    ('ת"א', "תביעה אזרחית"),
    ('ת"צ', "תובענה ייצוגית"),
    ('ע"א', "ערעור אזרחי"),
    ('ה"פ', "המרצת פתיחה"),
    ("פש\"ר", "פשיטת רגל / חדלות פירעון"),
    ("חדל\"פ", "חדלות פירעון"),
    ('ת"פ', "תיק פלילי"),
    ('ע"פ', "ערעור פלילי"),
    ('בש"א', "בקשה בהליך אזרחי"),
    ('רע"א', "רשות ערעור אזרחי"),
    ('עת"מ', "עתירה מנהלית"),
    ('בג"ץ', "עתירה לבג\"ץ"),
    ('הוצ"ל', "הוצאה לפועל"),
    ('ת"ע', "תיק עיזבון"),
    ('תמ"ש', "תיק משפחה"),
    ('סע"ש', "סכסוך עבודה בסמכות שופט"),
    ('דמ"ש', "דיון מהיר"),
    ('ת"ק', "תביעות קטנות"),
    ('עב"ל', "ערעור בענייני עבודה"),
    ('בל"ל', "בקשה בענייני ביטוח לאומי"),
]


async def seed_courts(db):
    for court_data in COURTS:
        existing = await db.execute(
            select(Court).where(Court.name == court_data["name"])
        )
        if not existing.scalar_one_or_none():
            db.add(Court(**court_data))
    await db.commit()
    logger.info("courts_seeded", count=len(COURTS))


async def main():
    logger.info("seed_start")
    async with AsyncSessionLocal() as db:
        await seed_courts(db)
    logger.info("seed_done")


if __name__ == "__main__":
    asyncio.run(main())
