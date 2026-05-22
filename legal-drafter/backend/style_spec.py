"""Formatting constants for Drai Rifer & Co. legal documents.

Single source of truth. Every other module MUST import from here — any
hard-coded formatting value elsewhere is a bug.

Unit conventions
----------------
- DXA (twentieths of a point): 1440 DXA = 1 inch = 2.54 cm.
- Font size: half-points (Word convention). 24 = 12pt, 32 = 16pt, 36 = 18pt.
- Line spacing: w:line value in 240ths of a line; 360 with lineRule=auto → 1.5 spacing.
"""

# ---------------------------------------------------------------------------
# Page setup — A4 with 2.5 cm margins (firm standard)
# ---------------------------------------------------------------------------

PAGE = dict(
    width_dxa=11906,        # A4 width  (210 mm)
    height_dxa=16838,       # A4 height (297 mm)
    margin_top=1418,        # ~2.5 cm
    margin_right=1418,
    margin_bottom=1418,
    margin_left=1418,
    header=720,
    footer=720,
    bidi=True,              # RTL section
    rtl_gutter=True,
    line_pitch=360,
)

# ---------------------------------------------------------------------------
# Font defaults
# ---------------------------------------------------------------------------

FONT_NAME = "David"
FONT_NAME_CS = "David"      # Complex script (Hebrew) — must be set or Word fallbacks
FONT_COLOR_HEX = "000000"
LIGATURES = "none"

# ---------------------------------------------------------------------------
# Sizes in half-points
# ---------------------------------------------------------------------------

SIZE_BODY = 24              # 12pt — standard body text
SIZE_BODY_LARGE = 28        # 14pt — petitions, motions header rows
SIZE_HEADING = 32           # 16pt — document title (centered, bold+underline)
SIZE_HEADING_LARGE = 36     # 18pt — large titles (e.g., statements of claim)
SIZE_QUOTE = 22             # 11pt — block quotes from case law

# ---------------------------------------------------------------------------
# Paragraph defaults
# ---------------------------------------------------------------------------

LINE_SPACING = 360          # w:line=360 lineRule=auto → 1.5 line spacing
ALIGN_DEFAULT = "both"      # justified

# Numbered paragraph indents (for argument body)
NUM_INDENT_LEFT = 620
NUM_HANGING = 620

# Party-block indent (for attorney details, address, contact lines)
PARTY_DETAILS_INDENT = 1440
PARTY_DETAILS_INDENT_DEEP = 2160   # used in some templates

# Block quote indent
QUOTE_INDENT_LEFT = 720
QUOTE_INDENT_RIGHT = 720

# Default vertical spacing after empty paragraphs / blocks
SPACE_AFTER_DEFAULT = 0
SPACE_AFTER_BLOCK = 120

# ---------------------------------------------------------------------------
# Firm contact block — exact strings as they appear in firm letterhead
# ---------------------------------------------------------------------------

FIRM_NAME_HE = "דרעי, רייפר ושות׳"
FIRM_ADDRESS_HE = "מרח׳ הארבעה 28 תל אביב-יפו, מגדל צפוני, ק׳ 34"
FIRM_PHONE = "03-7957444"
FIRM_FAX = "03-7429911"
FIRM_EMAIL_INTERNAL = "office@drlawfirm.com"
FIRM_EMAIL_EXTERNAL = "info@drlawfirm.co.il"

# ---------------------------------------------------------------------------
# Drafting attorney defaults
# ---------------------------------------------------------------------------

DEFAULT_ATTORNEY_NAME = "עו\"ד עמית חלון"
DEFAULT_ATTORNEY_BAR = "102451"
SENIOR_PARTNER_NAME = "ד\"ר אסף דרעי"
SENIOR_PARTNER_BAR = "39322"

# ---------------------------------------------------------------------------
# Hyperlink color (for email addresses in party blocks)
# ---------------------------------------------------------------------------

HYPERLINK_COLOR_HEX = "0563C1"

# ---------------------------------------------------------------------------
# Document type vocabulary (canonical Hebrew strings used across the system)
# ---------------------------------------------------------------------------

DOC_TYPES = (
    "כתב תביעה",
    "כתב הגנה",
    "בקשה",
    "בקשה בהסכמה",
    "בקשת רשות ערעור",
    "תשובה לבקשה",
    "תגובה לבקשה",
    "תצהיר עדות ראשית",
    "תצהיר תומך בבקשה",
    "מכתב התראה",
    "סיכומים",
    "רשימת בקשות",
    "פסיקתא",
    "other",
)

# Filename heuristics for doc_type inference (substrings → doc_type)
DOC_TYPE_HEURISTICS = (
    ("תצהיר עדות ראשית", "תצהיר עדות ראשית"),
    ("תצהיר", "תצהיר תומך בבקשה"),
    ("כתב תביעה", "כתב תביעה"),
    ("כתב הגנה", "כתב הגנה"),
    ("בקשת רשות ערעור", "בקשת רשות ערעור"),
    ("רמש", "בקשת רשות ערעור"),
    ("בקשה בהסכמה", "בקשה בהסכמה"),
    ("בהסכמה", "בקשה בהסכמה"),
    ("תשובה לבקשה", "תשובה לבקשה"),
    ("תשובה", "תשובה לבקשה"),
    ("תגובה לבקשה", "תגובה לבקשה"),
    ("תגובה", "תגובה לבקשה"),
    ("פסיקתא", "פסיקתא"),
    ("סיכומים", "סיכומים"),
    ("רשימת בקשות", "רשימת בקשות"),
    ("מכתב התראה", "מכתב התראה"),
    ("מכתב", "מכתב התראה"),
    ("התראה", "מכתב התראה"),
    ("בקשה", "בקשה"),
)

# ---------------------------------------------------------------------------
# Court vocabulary (frontend dropdown options)
# ---------------------------------------------------------------------------

COURTS = (
    "בית המשפט השלום בתל אביב-יפו",
    "בית המשפט השלום בירושלים",
    "בית המשפט השלום בחיפה",
    "בית המשפט המחוזי בתל אביב-יפו",
    "בית המשפט המחוזי בחיפה",
    "בית המשפט המחוזי מרכז-לוד",
    "בית המשפט המחוזי בירושלים",
    "בית המשפט העליון",
    "בית המשפט לענייני משפחה בתל אביב",
    "בית הדין האזורי לעבודה בתל אביב",
)
