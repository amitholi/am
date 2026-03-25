"""
Placeholder for Net Hamishpat (נט המשפט) scraper.
Requires smart card (Komsign) authentication.
NOT IMPLEMENTED - interface only.
"""


class NetHamishpatScraper:
    """
    Future scraper for Net Hamishpat court system.
    Requires Komsign smart card authentication.
    All methods raise NotImplementedError.
    """

    def __init__(self):
        self.authenticated = False

    async def authenticate(self, certificate_path: str, pin: str) -> bool:
        raise NotImplementedError(
            "נט המשפט מצריך אימות עם כרטיס חכם (קומסין). "
            "יש לממש אימות PKI מול מערכת בית המשפט."
        )

    async def search_case(self, case_number: str) -> dict:
        raise NotImplementedError(
            "חיפוש בנט המשפט מצריך אימות. "
            "ראה: https://www.courts.gov.il/net-hamishpat"
        )

    async def get_case_documents(self, case_id: str) -> list:
        raise NotImplementedError(
            "גישה למסמכי תיק מנט המשפט מצריכה אימות."
        )

    async def get_hearings(self, case_id: str) -> list:
        raise NotImplementedError(
            "גישה ללוח דיונים מנט המשפט מצריכה אימות."
        )

    async def get_case_parties(self, case_id: str) -> list:
        raise NotImplementedError(
            "גישה לצדדים בתיק מנט המשפט מצריכה אימות."
        )
