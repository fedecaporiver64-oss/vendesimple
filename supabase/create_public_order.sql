-- VendeSimple: creación segura de pedidos públicos desde una tienda activa.
-- Ejecutar una sola vez en Supabase SQL Editor.
create or replace function public.create_public_order(
  p_business_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_total numeric(12,2) := 0;
  v_line_total numeric(12,2);
  v_product record;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_name text := btrim(coalesce(p_customer_name, ''));
  v_phone text := btrim(coalesce(p_customer_phone, ''));
begin
  if v_name = '' or length(v_name) > 100 then
    raise exception 'Ingresá un nombre válido (hasta 100 caracteres).';
  end if;
  if v_phone = '' or length(v_phone) > 40 then
    raise exception 'Ingresá un teléfono válido.';
  end if;
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1
     or jsonb_array_length(p_items) > 50 then
    raise exception 'El carrito no es válido.';
  end if;

  if not exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.is_active = true
  ) then
    raise exception 'La tienda no está disponible.';
  end if;

  insert into public.orders (business_id, customer_name, customer_phone, status, total)
  values (p_business_id, v_name, v_phone, 'pending', 0)
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce(v_item->>'product_id', '') = ''
       or coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]{0,3}$' then
      raise exception 'Hay un producto o una cantidad inválida.';
    end if;

    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    select p.id, p.name, p.price, p.stock
      into v_product
    from public.products p
    where p.id = v_product_id
      and p.business_id = p_business_id
      and p.is_active = true
    for update;

    if not found then
      raise exception 'Uno de los productos ya no está disponible.';
    end if;
    if v_product.stock is not null and v_product.stock < v_quantity then
      raise exception 'No hay stock suficiente de: %.', v_product.name;
    end if;

    v_line_total := v_product.price * v_quantity;
    v_total := v_total + v_line_total;

    insert into public.order_items (order_id, product_id, product_name, quantity, unit_price)
    values (v_order_id, v_product.id, v_product.name, v_quantity, v_product.price);

    if v_product.stock is not null then
      update public.products
      set stock = stock - v_quantity
      where id = v_product.id;
    end if;
  end loop;

  update public.orders set total = v_total where id = v_order_id;
  return v_order_id;
end;
$$;

revoke all on function public.create_public_order(uuid, text, text, jsonb) from public;
grant execute on function public.create_public_order(uuid, text, text, jsonb) to anon, authenticated;
