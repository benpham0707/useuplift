do $bucket$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (
      id,
      name,
      public,
      file_size_limit,
      allowed_mime_types
    )
    values (
      'college-source-releases',
      'college-source-releases',
      false,
      134217728,
      array[
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream',
        'text/csv',
        'application/json'
      ]
    )
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;
end
$bucket$;
