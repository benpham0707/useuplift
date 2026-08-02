begin;

alter table public.institution_identifiers
  drop constraint institution_identifiers_no_overlap;

alter table public.institution_identifiers
  add constraint institution_identifiers_no_cross_institution_overlap
  exclude using gist (
    scheme with =,
    value with =,
    institution_id with <>,
    daterange(valid_from, coalesce(valid_to, 'infinity'::date), '[]') with &&
  );

commit;
