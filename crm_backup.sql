--
-- PostgreSQL database dump
--

\restrict GcoBGtpMIoUCahn19An1TfNjitXwcfVz6Iox15pVg5Zg10xc7L7WSKVFw6M05Tj

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DealStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DealStatus" AS ENUM (
    'ACTIVE',
    'WON',
    'LOST',
    'CANCELLED'
);


ALTER TYPE public."DealStatus" OWNER TO postgres;

--
-- Name: HistoryChangeType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."HistoryChangeType" AS ENUM (
    'NORMAL',
    'EDIT',
    'MANAGER_OVERRIDE',
    'SYSTEM'
);


ALTER TYPE public."HistoryChangeType" OWNER TO postgres;

--
-- Name: MembershipRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MembershipRole" AS ENUM (
    'INTERNAL_ADMIN',
    'MANAGER',
    'SALES',
    'TECHNICAL',
    'CLIENT_ADMIN',
    'CLIENT_MEMBER',
    'CLIENT_VIEWER'
);


ALTER TYPE public."MembershipRole" OWNER TO postgres;

--
-- Name: MembershipStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MembershipStatus" AS ENUM (
    'ACTIVE',
    'INVITED',
    'SUSPENDED'
);


ALTER TYPE public."MembershipStatus" OWNER TO postgres;

--
-- Name: OrganizationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrganizationType" AS ENUM (
    'INTERNAL',
    'CLIENT'
);


ALTER TYPE public."OrganizationType" OWNER TO postgres;

--
-- Name: ReviewStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReviewStatus" AS ENUM (
    'NOT_STARTED',
    'IN_REVIEW',
    'COMPLETED',
    'OVERRIDDEN'
);


ALTER TYPE public."ReviewStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'SALES',
    'TECHNICAL',
    'MANAGER',
    'CLIENT'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Company; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Company" (
    id text NOT NULL,
    name text NOT NULL,
    industry text,
    phone text,
    email text,
    website text,
    address text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Company" OWNER TO postgres;

--
-- Name: Contact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Contact" (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text,
    email text,
    phone text,
    "jobTitle" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Contact" OWNER TO postgres;

--
-- Name: Deal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Deal" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "companyId" text NOT NULL,
    "contactId" text,
    "stageId" text NOT NULL,
    "ownerId" text,
    amount numeric(15,2),
    currency text DEFAULT 'INR'::text NOT NULL,
    status public."DealStatus" DEFAULT 'ACTIVE'::public."DealStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Deal" OWNER TO postgres;

--
-- Name: DealHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DealHistory" (
    id text NOT NULL,
    "dealId" text NOT NULL,
    "changedById" text,
    "changeType" public."HistoryChangeType" NOT NULL,
    field text,
    "oldValue" text,
    "newValue" text,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DealHistory" OWNER TO postgres;

--
-- Name: DealReview; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DealReview" (
    id text NOT NULL,
    "dealId" text NOT NULL,
    status public."ReviewStatus" DEFAULT 'NOT_STARTED'::public."ReviewStatus" NOT NULL,
    "startedAt" timestamp(3) without time zone,
    deadline timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "estimatedCost" numeric(15,2),
    "expectedProfit" numeric(15,2),
    "expectedMargin" numeric(5,2),
    "customerTargetPrice" numeric(15,2),
    "minimumPrice" numeric(15,2),
    "currentOffer" numeric(15,2),
    "negotiationNotes" text,
    "riskNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DealReview" OWNER TO postgres;

--
-- Name: DealStage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DealStage" (
    id text NOT NULL,
    name text NOT NULL,
    "order" integer NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DealStage" OWNER TO postgres;

--
-- Name: Membership; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Membership" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "organizationId" text NOT NULL,
    role public."MembershipRole" NOT NULL,
    status public."MembershipStatus" DEFAULT 'ACTIVE'::public."MembershipStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Membership" OWNER TO postgres;

--
-- Name: Organization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Organization" (
    id text NOT NULL,
    name text NOT NULL,
    type public."OrganizationType" NOT NULL,
    "companyId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Organization" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    role public."UserRole" NOT NULL,
    "companyId" text,
    "companyAdmin" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clerkUserId" text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Company" (id, name, industry, phone, email, website, address, "createdAt", "updatedAt") FROM stdin;
cmteneo6f000078rrybprgamp	Acme Corporation	Technology	+91 9876543210	contact@acme.example	https://acme.example	Mumbai, Maharashtra	2026-08-29 17:22:20.008	2026-08-29 17:22:20.008
cmtm5h19r0000chrry7islpnq	Sakura Precision Systems	\N	\N	\N	\N	\N	2026-09-03 23:22:26.607	2026-09-03 23:22:26.607
\.


--
-- Data for Name: Contact; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Contact" (id, "companyId", "firstName", "lastName", email, phone, "jobTitle", "createdAt", "updatedAt") FROM stdin;
cmteq0iy300000irriaq6n6g3	cmteneo6f000078rrybprgamp	John	Doe	john.doe@acme.example	+91 9876543211	Sales Manager	2026-08-29 18:35:18.891	2026-08-29 18:35:18.891
\.


--
-- Data for Name: Deal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Deal" (id, title, description, "companyId", "contactId", "stageId", "ownerId", amount, currency, status, "createdAt", "updatedAt") FROM stdin;
cmteq5l9o00010irr1hxc3k1r	Acme CRM Implementation	CRM implementation project for Acme Corporation	cmteneo6f000078rrybprgamp	cmteq0iy300000irriaq6n6g3	cmtemdaud00004irrf29zbqiy	\N	250000.00	INR	ACTIVE	2026-08-29 18:39:15.18	2026-08-29 18:39:15.18
cmteu9mbc0000u2rrtukusvif	Sony	New expansion opportunity	cmteneo6f000078rrybprgamp	cmteq0iy300000irriaq6n6g3	cmtemdawa00034irr50nz6awa	\N	750000.00	INR	ACTIVE	2026-08-29 20:34:21.624	2026-09-03 20:50:52.323
cmterou6o0000a6rrchb7qmd5	tata enterprises	Expansion opportunity	cmteneo6f000078rrybprgamp	cmteq0iy300000irriaq6n6g3	cmtemdaw500024irr5m5hgoqa	\N	500000.00	INR	ACTIVE	2026-08-29 19:22:12.816	2026-09-03 20:56:37.555
\.


--
-- Data for Name: DealHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DealHistory" (id, "dealId", "changedById", "changeType", field, "oldValue", "newValue", reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: DealReview; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DealReview" (id, "dealId", status, "startedAt", deadline, "completedAt", "estimatedCost", "expectedProfit", "expectedMargin", "customerTargetPrice", "minimumPrice", "currentOffer", "negotiationNotes", "riskNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DealStage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DealStage" (id, name, "order", description, "createdAt", "updatedAt") FROM stdin;
cmtemdaud00004irrf29zbqiy	Lead	1	New potential opportunity	2026-08-29 16:53:16.454	2026-08-29 16:53:16.454
cmtemdavz00014irruni522q9	Qualified	2	Opportunity has been qualified	2026-08-29 16:53:16.511	2026-08-29 16:53:16.511
cmtemdaw500024irr5m5hgoqa	Proposal	3	Proposal or quotation has been submitted	2026-08-29 16:53:16.517	2026-08-29 16:53:16.517
cmtemdawa00034irr50nz6awa	Negotiation	4	Commercial or technical terms are being negotiated	2026-08-29 16:53:16.522	2026-08-29 16:53:16.522
cmtemdawd00044irrwdf8zdnd	Won	5	Deal has been successfully closed	2026-08-29 16:53:16.526	2026-08-29 16:53:16.526
cmtemdawh00054irrgvoic1mo	Lost	6	Deal was not successfully closed	2026-08-29 16:53:16.529	2026-08-29 16:53:16.529
\.


--
-- Data for Name: Membership; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Membership" (id, "userId", "organizationId", role, status, "createdAt", "updatedAt") FROM stdin;
cmth1l5xy0002xmrre3hm5lpg	cmth1l5x60000xmrrmgb4a397	cmth1l5xt0001xmrrcfoykzhr	MANAGER	ACTIVE	2026-08-31 09:34:49.942	2026-08-31 09:34:49.942
cmtm2kp6q0001ihrr155dt7w5	cmtm2kp4d0000ihrrhv55n0bi	cmth1l5xt0001xmrrcfoykzhr	SALES	ACTIVE	2026-09-03 22:01:18.723	2026-09-03 22:01:18.723
cmtm5h1ae0003chrrww08p8vp	cmtm5h19v0001chrrgd1edlr7	cmtm5h1a40002chrr8ntjpbkw	CLIENT_ADMIN	ACTIVE	2026-09-03 23:22:26.63	2026-09-03 23:22:26.63
\.


--
-- Data for Name: Organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Organization" (id, name, type, "companyId", "createdAt", "updatedAt") FROM stdin;
cmth1l5xt0001xmrrcfoykzhr	Ichikawa Solutions Ltd.	INTERNAL	\N	2026-08-31 09:34:49.937	2026-08-31 09:34:49.937
cmtm5h1a40002chrr8ntjpbkw	Sakura Precision Systems	CLIENT	cmtm5h19r0000chrry7islpnq	2026-09-03 23:22:26.621	2026-09-03 23:22:26.621
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, name, role, "companyId", "companyAdmin", "createdAt", "updatedAt", "clerkUserId") FROM stdin;
cmth1l5x60000xmrrmgb4a397	ichikawajirosan25@gmail.com	Jiro Ichikawa	MANAGER	\N	f	2026-08-31 09:34:49.915	2026-08-31 09:34:49.915	user_3HrnhCEJfFwUqpK3P92KpwKzkzt
cmtm2kp4d0000ihrrhv55n0bi	lotlikerdevang96@gmail.com	Jason Mendes	SALES	\N	f	2026-09-03 22:01:18.638	2026-09-03 22:01:18.638	user_3IlR25engviGmcSE6uZ9jMEvQjM
cmtm5h19v0001chrrgd1edlr7	kosasey460@dd2car.com	client-manager	CLIENT	cmtm5h19r0000chrry7islpnq	t	2026-09-03 23:22:26.611	2026-09-03 23:22:26.611	user_3IpzwhoJMufnGb4GBFRJ4mHInYL
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d3c88d73-dc98-43ef-94eb-19d4e962e29b	cefd3c18df15ca1ac0156093a0e173e410328d6d217890d4755969e2fe1befbe	2026-08-26 19:56:29.894769+05:30	20260825101739_initial_crm_schema	\N	\N	2026-08-26 19:56:29.842484+05:30	1
bf30dbe5-2ca6-4973-b4de-0aae772346ce	ef8de9126c1d8eb7c391e782d2df697179acb51001c2fcddc460a5e0fbf6c3c2	2026-08-29 22:22:55.588453+05:30	20260829165255_add_deal_stage_uniques	\N	\N	2026-08-29 22:22:55.571606+05:30	1
7d19be94-96f7-4ac0-b064-435df629d9b4	434ed3a54849a97904d02671d93221254d780aec10315021157f6826e63e47ad	2026-08-31 13:07:17.851544+05:30	20260831073717_access_management	\N	\N	2026-08-31 13:07:17.810443+05:30	1
\.


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: Contact Contact_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY (id);


--
-- Name: DealHistory DealHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DealHistory"
    ADD CONSTRAINT "DealHistory_pkey" PRIMARY KEY (id);


--
-- Name: DealReview DealReview_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DealReview"
    ADD CONSTRAINT "DealReview_pkey" PRIMARY KEY (id);


--
-- Name: DealStage DealStage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DealStage"
    ADD CONSTRAINT "DealStage_pkey" PRIMARY KEY (id);


--
-- Name: Deal Deal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_pkey" PRIMARY KEY (id);


--
-- Name: Membership Membership_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_pkey" PRIMARY KEY (id);


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: DealReview_dealId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DealReview_dealId_key" ON public."DealReview" USING btree ("dealId");


--
-- Name: DealStage_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DealStage_name_key" ON public."DealStage" USING btree (name);


--
-- Name: DealStage_order_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DealStage_order_key" ON public."DealStage" USING btree ("order");


--
-- Name: Membership_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Membership_organizationId_idx" ON public."Membership" USING btree ("organizationId");


--
-- Name: Membership_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Membership_userId_idx" ON public."Membership" USING btree ("userId");


--
-- Name: Membership_userId_organizationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON public."Membership" USING btree ("userId", "organizationId");


--
-- Name: Organization_companyId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Organization_companyId_key" ON public."Organization" USING btree ("companyId");


--
-- Name: Organization_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Organization_type_idx" ON public."Organization" USING btree (type);


--
-- Name: User_clerkUserId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_clerkUserId_key" ON public."User" USING btree ("clerkUserId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Contact Contact_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DealHistory DealHistory_changedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DealHistory"
    ADD CONSTRAINT "DealHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DealHistory DealHistory_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DealHistory"
    ADD CONSTRAINT "DealHistory_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public."Deal"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DealReview DealReview_dealId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DealReview"
    ADD CONSTRAINT "DealReview_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES public."Deal"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Deal Deal_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Deal Deal_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contact"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Deal Deal_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Deal Deal_stageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Deal"
    ADD CONSTRAINT "Deal_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES public."DealStage"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Membership Membership_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Membership Membership_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Organization Organization_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict GcoBGtpMIoUCahn19An1TfNjitXwcfVz6Iox15pVg5Zg10xc7L7WSKVFw6M05Tj

