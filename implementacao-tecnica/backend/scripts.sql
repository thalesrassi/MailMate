-- Scripts para criar a tabela emails no Supabase/PostgreSQL

create extension if not exists pgcrypto; -- para gen_random_uuid()

create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  conteudo text not null,
  classificacao text check (classificacao in ('Produtivo','Improdutivo')),
  resposta text,
  conteudo text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
