
insert into platforms (slug, name) values ('other', 'Other')
on conflict (slug) do nothing;
