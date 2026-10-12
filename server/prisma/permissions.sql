-- Run by a DBA while connected to db_magang if magang cannot create the schema.
-- These statements grant access only to the project's schema.
CREATE SCHEMA IF NOT EXISTS "iph_batu" AUTHORIZATION "magang";
GRANT USAGE, CREATE ON SCHEMA "iph_batu" TO "magang";
