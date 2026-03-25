"""Initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import TSVECTOR, JSONB

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "courts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("name_en", sa.String(255)),
        sa.Column("court_type", sa.String(50), nullable=False),
        sa.Column("district", sa.String(100)),
        sa.Column("city", sa.String(100)),
        sa.Column("address", sa.Text()),
        sa.Column("phone", sa.String(50)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "judges",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("title", sa.String(50)),
        sa.Column("court_id", sa.Integer(), sa.ForeignKey("courts.id")),
        sa.Column("appointment_date", sa.Date()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_judges_name", "judges", ["name"])

    op.create_table(
        "cases",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("case_number", sa.String(50), nullable=False),
        sa.Column("case_type", sa.String(10), nullable=False),
        sa.Column("case_type_description", sa.String(255)),
        sa.Column("court_id", sa.Integer(), sa.ForeignKey("courts.id")),
        sa.Column("filing_date", sa.Date()),
        sa.Column("status", sa.String(50)),
        sa.Column("status_date", sa.Date()),
        sa.Column("judge_name", sa.String(255)),
        sa.Column("judge_id", sa.Integer(), sa.ForeignKey("judges.id")),
        sa.Column("description", sa.Text()),
        sa.Column("decision_type", sa.String(100)),
        sa.Column("source_url", sa.Text()),
        sa.Column("raw_data", JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("search_vector", TSVECTOR),
        sa.UniqueConstraint("case_number", "court_id", name="uq_case_number_court"),
    )
    op.create_index("idx_cases_search", "cases", ["search_vector"], postgresql_using="gin")
    op.create_index("idx_cases_case_number", "cases", ["case_number"])
    op.create_index("idx_cases_filing_date", "cases", ["filing_date"])
    op.create_index("idx_cases_case_type", "cases", ["case_type"])
    op.create_index("idx_cases_status", "cases", ["status"])
    op.create_index("idx_cases_court_id", "cases", ["court_id"])
    op.create_index("idx_cases_judge_id", "cases", ["judge_id"])

    op.create_table(
        "parties",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("party_type", sa.String(50)),
        sa.Column("party_number", sa.Integer()),
        sa.Column("id_number", sa.String(20)),
        sa.Column("entity_type", sa.String(50)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_parties_name", "parties", ["name"])
    op.create_index("idx_parties_case_id", "parties", ["case_id"])

    op.create_table(
        "attorneys",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("license_number", sa.String(20), unique=True),
        sa.Column("firm_name", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_attorneys_name", "attorneys", ["name"])

    op.create_table(
        "case_attorneys",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("cases.id", ondelete="CASCADE")),
        sa.Column("attorney_id", sa.Integer(), sa.ForeignKey("attorneys.id")),
        sa.Column("party_id", sa.Integer(), sa.ForeignKey("parties.id")),
        sa.Column("role", sa.String(50)),
    )

    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_type", sa.String(100)),
        sa.Column("title", sa.String(500)),
        sa.Column("filing_date", sa.Date()),
        sa.Column("content", sa.Text()),
        sa.Column("source_url", sa.Text()),
        sa.Column("file_hash", sa.String(64), unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_documents_case_id", "documents", ["case_id"])

    op.create_table(
        "hearings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("case_id", sa.Integer(), sa.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hearing_date", sa.DateTime(timezone=True)),
        sa.Column("hearing_type", sa.String(100)),
        sa.Column("courtroom", sa.String(50)),
        sa.Column("judge_id", sa.Integer(), sa.ForeignKey("judges.id")),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_hearings_case_id", "hearings", ["case_id"])

    # FTS trigger for search_vector update
    op.execute("""
        CREATE OR REPLACE FUNCTION update_case_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('simple', COALESCE(NEW.case_number, '')), 'A') ||
                setweight(to_tsvector('simple', COALESCE(NEW.case_type_description, '')), 'B') ||
                setweight(to_tsvector('simple', COALESCE(NEW.judge_name, '')), 'B') ||
                setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'C');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER cases_search_vector_update
        BEFORE INSERT OR UPDATE ON cases
        FOR EACH ROW EXECUTE FUNCTION update_case_search_vector();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS cases_search_vector_update ON cases")
    op.execute("DROP FUNCTION IF EXISTS update_case_search_vector()")
    op.drop_table("hearings")
    op.drop_table("documents")
    op.drop_table("case_attorneys")
    op.drop_table("attorneys")
    op.drop_table("parties")
    op.drop_table("cases")
    op.drop_table("judges")
    op.drop_table("courts")
