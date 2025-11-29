--
-- PostgreSQL database dump
--

\restrict FZjd3sFYchJT8cU7OGDJxhdH4NHwHQ6eCNIkeF8mkEI0nWlfLN1ufzw6cge9pkM

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: dev
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO dev;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action character varying(255) NOT NULL,
    target_id uuid,
    target_type character varying(50),
    ip_address character varying(64),
    user_agent character varying(255),
    details jsonb,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO dev;

--
-- Name: file_versions; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.file_versions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    file_id uuid,
    version_number integer NOT NULL,
    s3_key character varying(512) NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now(),
    uploaded_by uuid,
    size_bytes bigint,
    checksum character varying(255),
    mime_type character varying(255)
);


ALTER TABLE public.file_versions OWNER TO dev;

--
-- Name: files; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    folder_id uuid,
    owner_id uuid,
    size_bytes bigint DEFAULT 0,
    s3_key character varying(512) NOT NULL,
    mime_type character varying(255),
    checksum character varying(255),
    version_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.files OWNER TO dev;

--
-- Name: folders; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.folders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    parent_id uuid,
    owner_id uuid,
    organization_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.folders OWNER TO dev;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    subscription_id uuid,
    stripe_invoice_id character varying(255),
    amount_usd numeric(10,2),
    status character varying(20) DEFAULT 'pending'::character varying,
    issued_at timestamp without time zone DEFAULT now(),
    paid_at timestamp without time zone,
    raw_payload jsonb,
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['paid'::character varying, 'pending'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.invoices OWNER TO dev;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.organizations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    storage_limit_gb integer DEFAULT 10,
    plan_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.organizations OWNER TO dev;

--
-- Name: plans; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    price_usd numeric(10,2) DEFAULT 0,
    storage_limit_gb integer DEFAULT 10,
    max_users integer DEFAULT 5,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plans OWNER TO dev;

--
-- Name: shares; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.shares (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    file_id uuid,
    shared_by uuid,
    shared_with_user uuid,
    shared_with_email character varying(255),
    link_token character varying(128),
    permission character varying(20) DEFAULT 'view'::character varying,
    password_hash text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT shares_permission_check CHECK (((permission)::text = ANY ((ARRAY['view'::character varying, 'edit'::character varying, 'download'::character varying])::text[])))
);


ALTER TABLE public.shares OWNER TO dev;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid,
    plan_id uuid,
    stripe_subscription_id character varying(255),
    status character varying(20) DEFAULT 'active'::character varying,
    start_date timestamp without time zone DEFAULT now(),
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT subscriptions_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'canceled'::character varying, 'expired'::character varying, 'past_due'::character varying])::text[])))
);


ALTER TABLE public.subscriptions OWNER TO dev;

--
-- Name: usage_stats; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.usage_stats (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid,
    total_storage_bytes bigint DEFAULT 0,
    file_count bigint DEFAULT 0,
    last_updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.usage_stats OWNER TO dev;

--
-- Name: users; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password_hash text,
    organization_id uuid,
    role character varying(50) DEFAULT 'member'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'member'::character varying, 'viewer'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO dev;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.audit_logs (id, user_id, action, target_id, target_type, ip_address, user_agent, details, "timestamp") FROM stdin;
\.


--
-- Data for Name: file_versions; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.file_versions (id, file_id, version_number, s3_key, uploaded_at, uploaded_by, size_bytes, checksum, mime_type) FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.files (id, name, folder_id, owner_id, size_bytes, s3_key, mime_type, checksum, version_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.folders (id, name, parent_id, owner_id, organization_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.invoices (id, subscription_id, stripe_invoice_id, amount_usd, status, issued_at, paid_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.organizations (id, name, storage_limit_gb, plan_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.plans (id, name, price_usd, storage_limit_gb, max_users, created_at) FROM stdin;
b2f307b9-cd79-448a-ade2-b30f95be609b	Free	0.00	1	1	2025-10-27 14:17:00.981653
e6a8b0fa-8473-4308-a09f-bf82461be0ca	Normal	4.99	100	3	2025-10-27 14:17:00.981653
680e8a9d-bec8-42f1-b957-e876a5f0a289	Pro	19.99	250	5	2025-10-27 14:17:00.981653
95fcf461-e8ec-419f-aeff-93944f7b090c	Enterprise	49.99	1000	10	2025-10-27 14:17:00.981653
\.


--
-- Data for Name: shares; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.shares (id, file_id, shared_by, shared_with_user, shared_with_email, link_token, permission, password_hash, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.subscriptions (id, organization_id, plan_id, stripe_subscription_id, status, start_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: usage_stats; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.usage_stats (id, organization_id, total_storage_bytes, file_count, last_updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public.users (id, email, name, password_hash, organization_id, role, created_at, updated_at) FROM stdin;
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: file_versions file_versions_file_id_version_number_key; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_file_id_version_number_key UNIQUE (file_id, version_number);


--
-- Name: file_versions file_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_name_key; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_name_key UNIQUE (name);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: shares shares_link_token_key; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_link_token_key UNIQUE (link_token);


--
-- Name: shares shares_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: usage_stats usage_stats_organization_id_key; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.usage_stats
    ADD CONSTRAINT usage_stats_organization_id_key UNIQUE (organization_id);


--
-- Name: usage_stats usage_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.usage_stats
    ADD CONSTRAINT usage_stats_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_target; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_audit_target ON public.audit_logs USING btree (target_type, target_id);


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_audit_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_file_folder; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_file_folder ON public.files USING btree (folder_id);


--
-- Name: idx_file_owner; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_file_owner ON public.files USING btree (owner_id);


--
-- Name: idx_file_version_file; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_file_version_file ON public.file_versions USING btree (file_id);


--
-- Name: idx_folder_org; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_folder_org ON public.folders USING btree (organization_id);


--
-- Name: idx_folder_parent; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_folder_parent ON public.folders USING btree (parent_id);


--
-- Name: idx_invoice_stripe; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_invoice_stripe ON public.invoices USING btree (stripe_invoice_id);


--
-- Name: idx_invoice_sub; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_invoice_sub ON public.invoices USING btree (subscription_id);


--
-- Name: idx_org_plan; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_org_plan ON public.organizations USING btree (plan_id);


--
-- Name: idx_share_file; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_share_file ON public.shares USING btree (file_id);


--
-- Name: idx_share_user; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_share_user ON public.shares USING btree (shared_with_user);


--
-- Name: idx_sub_org; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_sub_org ON public.subscriptions USING btree (organization_id);


--
-- Name: idx_sub_stripe; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_sub_stripe ON public.subscriptions USING btree (stripe_subscription_id);


--
-- Name: idx_user_org; Type: INDEX; Schema: public; Owner: dev
--

CREATE INDEX idx_user_org ON public.users USING btree (organization_id);


--
-- Name: uniq_file_folder_name; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX uniq_file_folder_name ON public.files USING btree (folder_id, name);


--
-- Name: files trg_update_files; Type: TRIGGER; Schema: public; Owner: dev
--

CREATE TRIGGER trg_update_files BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: organizations trg_update_orgs; Type: TRIGGER; Schema: public; Owner: dev
--

CREATE TRIGGER trg_update_orgs BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users trg_update_users; Type: TRIGGER; Schema: public; Owner: dev
--

CREATE TRIGGER trg_update_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: file_versions file_versions_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: file_versions file_versions_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.file_versions
    ADD CONSTRAINT file_versions_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: files files_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- Name: files files_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: folders folders_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: folders folders_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: folders folders_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;


--
-- Name: organizations organizations_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;


--
-- Name: shares shares_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE CASCADE;


--
-- Name: shares shares_shared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_shared_by_fkey FOREIGN KEY (shared_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: shares shares_shared_with_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_shared_with_user_fkey FOREIGN KEY (shared_with_user) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;


--
-- Name: usage_stats usage_stats_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.usage_stats
    ADD CONSTRAINT usage_stats_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict FZjd3sFYchJT8cU7OGDJxhdH4NHwHQ6eCNIkeF8mkEI0nWlfLN1ufzw6cge9pkM

