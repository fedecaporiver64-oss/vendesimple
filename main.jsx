import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Store, ShoppingBag, Package, LogOut, Plus, Eye, EyeOff, ArrowRight, CircleHelp, Pencil, Trash2 } from 'lucide-react';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey && !supabaseUrl.includes('TU-PROYECTO') ? createClient(supabaseUrl, supabaseKey) : null;

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);
  const [publicStore, setPublicStore] = useState(null);
  const [publicProducts, setPublicProducts] = useState([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicError, setPublicError] = useState('');
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState('');
  const publicMatch = window.location.pathname.match(/^\/tienda\/([^/]+)\/?$/);
  const publicSlug = publicMatch ? decodeURIComponent(publicMatch[1]) : '';

  useEffect(() => {
    if (!publicSlug || !supabase) return;
    let cancelled = false;
    async function loadPublicStore() {
      setPublicLoading(true);
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id, name, description, whatsapp, slug')
        .eq('slug', publicSlug)
        .eq('is_active', true)
        .maybeSingle();
      if (cancelled) return;
      if (businessError || !business) {
        setPublicError(businessError?.message || 'No encontramos esta tienda o no está disponible.');
        setPublicLoading(false);
        return;
      }
      const { data: items, error: productsError } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, category, stock')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (productsError) setPublicError(productsError.message);
      else {
        setPublicStore(business);
        setPublicProducts(items || []);
      }
      setPublicLoading(false);
    }
    loadPublicStore();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let mounted = true;
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (mounted) setSession(data.session);
      })
      .catch((err) => { if (mounted) setNotice(err.message || 'No se pudo verificar la sesión.'); })
      .finally(() => { if (mounted) setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update-password');
        setNotice('Ingresá tu nueva contraseña para completar la recuperación.');
      }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => { if (session) loadBusinesses(); }, [session]);

  async function loadBusinesses() {
    const { data, error } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
    if (error) { setNotice(error.message); return; }
    setBusinesses(data || []);
    if (data?.length) { setActiveBusiness(data[0]); loadProducts(data[0].id); }
  }
  async function loadProducts(businessId) {
    const { data, error } = await supabase.from('products').select('*').eq('business_id', businessId).order('created_at', { ascending: false });
    if (error) { setNotice(error.message); return; }
    setProducts(data || []);
  }
  async function authenticate(e) {
    e.preventDefault(); setBusy(true); setNotice('');
    try {
      if (!supabase) throw new Error('Falta configurar la conexión con Supabase. Seguí la guía de instalación incluida.');
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setNotice('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisá también el correo no deseado.');
        return;
      }
      if (mode === 'update-password') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword(''); setMode('login');
        setNotice('Contraseña actualizada correctamente. Ya podés ingresar con tu nueva contraseña.');
        await supabase.auth.signOut();
        return;
      }
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) setNotice('Cuenta creada. Revisá tu correo y confirmá la dirección para ingresar.');
        else setNotice('Cuenta creada correctamente.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) { setNotice(err.message || 'No se pudo completar la operación.'); }
    finally { setBusy(false); }
  }
  async function createBusiness(e) {
    e.preventDefault(); setBusy(true); setNotice('');
    const slugBase = businessName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from('businesses').insert({ owner_id: session.user.id, name: businessName.trim(), slug, whatsapp: whatsapp.trim() || null }).select().single();
    setBusy(false);
    if (error) { setNotice(error.message); return; }
    setNotice('Tu tienda fue creada.'); setBusinessName(''); setWhatsapp('');
    await loadBusinesses(); setActiveBusiness(data); setProducts([]);
  }
  async function addProduct(e) {
    e.preventDefault(); if (!activeBusiness) return;
    setBusy(true); setNotice('');
    const { error } = await supabase.from('products').insert({ business_id: activeBusiness.id, name: productName.trim(), price: Number(productPrice), description: productDescription.trim() || null });
    setBusy(false);
    if (error) { setNotice(error.message); return; }
    setProductName(''); setProductPrice(''); setProductDescription(''); setNotice('Producto agregado.'); loadProducts(activeBusiness.id);
  }
  async function saveProduct(e) {
    e.preventDefault();
    if (!activeBusiness || !editingProductId) return;
    setBusy(true); setNotice('');
    const { error } = await supabase.from('products').update({
      name: productName.trim(),
      price: Number(productPrice),
      description: productDescription.trim() || null
    }).eq('id', editingProductId).eq('business_id', activeBusiness.id);
    setBusy(false);
    if (error) { setNotice(error.message); return; }
    setEditingProductId(null); setProductName(''); setProductPrice(''); setProductDescription('');
    setNotice('Producto actualizado correctamente.');
    await loadProducts(activeBusiness.id);
  }
  function startEditProduct(product) {
    setEditingProductId(product.id);
    setProductName(product.name || '');
    setProductPrice(String(product.price ?? ''));
    setProductDescription(product.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function deleteProduct(product) {
    if (!window.confirm('¿Querés eliminar el producto "' + product.name + '"?')) return;
    setBusy(true); setNotice('');
    const { error } = await supabase.from('products').delete().eq('id', product.id).eq('business_id', activeBusiness.id);
    setBusy(false);
    if (error) { setNotice(error.message); return; }
    setNotice('Producto eliminado.');
    await loadProducts(activeBusiness.id);
  }
  function addToCart(product) {
    setCart(current => {
      const existing = current[product.id]?.quantity || 0;
      const nextQuantity = existing + 1;
      if (product.stock !== null && product.stock !== undefined && nextQuantity > product.stock) {
        setCheckoutNotice('No hay más unidades disponibles de ' + product.name + '.');
        return current;
      }
      setCheckoutNotice('');
      return { ...current, [product.id]: { product, quantity: nextQuantity } };
    });
  }
  function changeCartQuantity(product, quantity) {
    const safeQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
    if (product.stock !== null && product.stock !== undefined && safeQuantity > product.stock) return;
    setCart(current => {
      const next = { ...current };
      if (safeQuantity === 0) delete next[product.id];
      else next[product.id] = { product, quantity: safeQuantity };
      return next;
    });
  }
  async function submitPublicOrder(e) {
    e.preventDefault();
    if (!publicStore || !cartItems.length) return;
    setCheckoutBusy(true); setCheckoutNotice('');
    try {
      const { data, error } = await supabase.rpc('create_public_order', {
        p_business_id: publicStore.id,
        p_customer_name: customerName.trim(),
        p_customer_phone: customerPhone.trim(),
        p_items: cartItems.map(item => ({ product_id: item.product.id, quantity: item.quantity }))
      });
      if (error) throw error;
      setCart({}); setCustomerName(''); setCustomerPhone('');
      setCheckoutNotice('¡Pedido enviado! Número de pedido: ' + data);
    } catch (err) {
      setCheckoutNotice(err.message || 'No se pudo enviar el pedido. Revisá los datos e intentá nuevamente.');
    } finally { setCheckoutBusy(false); }
  }
  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  async function signOut() { await supabase.auth.signOut(); setBusinesses([]); setActiveBusiness(null); setProducts([]); }

  if (publicSlug) {
    if (!supabase) return <main className="center"><section className="setup-card"><Brand/><h1>Tienda temporalmente no disponible</h1><p>La conexión de la tienda todavía no está configurada.</p></section></main>;
    if (publicLoading) return <main className="center"><div className="loader"/><p>Cargando tienda…</p></main>;
    if (publicError) return <main className="center"><section className="setup-card"><Brand/><h1>No pudimos abrir esta tienda</h1><p>{publicError}</p><a href="/" className="primary">Ir a VendeSimple</a></section></main>;
    if (publicStore) return <main className="public-store"><header className="public-header"><Brand/><a href="/">Crear mi tienda</a></header><section className="public-hero"><span className="eyebrow">TIENDA ONLINE</span><h1>{publicStore.name}</h1>{publicStore.description && <p>{publicStore.description}</p>}{publicStore.whatsapp && <a className="primary" href={'https://wa.me/' + publicStore.whatsapp.replace(/[^0-9]/g, '')} target="_blank" rel="noreferrer">Consultar por WhatsApp</a>}</section><section className="public-catalog"><div className="section-heading"><div><h2>Productos</h2><p className="muted">Conocé nuestro catálogo</p></div><span className="count-pill">{publicProducts.length} productos</span></div>{publicProducts.length === 0 ? <div className="panel empty"><ShoppingBag size={28}/><b>Próximamente</b><span>Esta tienda todavía no publicó productos.</span></div> : <div className="public-product-grid">{publicProducts.map(product => <article className="public-product" key={product.id}>{product.image_url ? <img src={product.image_url} alt={product.name}/> : <div className="public-product-placeholder"><Package size={30}/></div>}<div className="public-product-info">{product.category && <small>{product.category}</small>}<h3>{product.name}</h3>{product.description && <p>{product.description}</p>}<strong>{new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(product.price)}</strong>{product.stock !== null && product.stock !== undefined && <small>{product.stock > 0 ? 'Disponibles: ' + product.stock : 'Sin stock'}</small>}<button className="primary add-cart-btn" type="button" disabled={product.stock === 0} onClick={()=>addToCart(product)}>{product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}</button></div></article>)}</div>}
  {cartItems.length > 0 && <section className="checkout-panel"><div className="section-heading"><div><h2>Tu carrito</h2><p className="muted">Revisá las cantidades antes de enviar el pedido.</p></div><span className="count-pill">{cartItems.reduce((n,item)=>n+item.quantity,0)} unidades</span></div><div className="cart-lines">{cartItems.map(item=><div className="cart-line" key={item.product.id}><div><b>{item.product.name}</b><small>{new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(item.product.price)} c/u</small></div><div className="quantity-control"><button type="button" onClick={()=>changeCartQuantity(item.product,item.quantity-1)} aria-label="Quitar una unidad">−</button><span>{item.quantity}</span><button type="button" onClick={()=>changeCartQuantity(item.product,item.quantity+1)} aria-label="Agregar una unidad">+</button></div><strong>{new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(Number(item.product.price)*item.quantity)}</strong></div>)}</div><div className="cart-total"><span>Total estimado</span><strong>{new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(cartTotal)}</strong></div><form className="checkout-form" onSubmit={submitPublicOrder}><label>Tu nombre<input value={customerName} onChange={e=>setCustomerName(e.target.value)} required maxLength={100} placeholder="Nombre y apellido"/></label><label>Teléfono de contacto<input value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} required maxLength={40} placeholder="Código de área + número"/></label><button className="primary" disabled={checkoutBusy}>{checkoutBusy?'Enviando pedido…':'Enviar pedido'}</button></form>{checkoutNotice && <div className="notice">{checkoutNotice}</div>}<p className="checkout-note">El envío del pedido no implica un cobro online. La tienda se contactará para coordinar el pago y la entrega.</p></section>}
  <footer className="footer"><span>© {new Date().getFullYear()} {publicStore.name}</span><span>Tienda creada con VendeSimple</span></footer></main>;
  }
  if (loading) return <main className="center"><div className="loader"/><p>Preparando VendeSimple…</p></main>;
  if (!supabase) return <main className="center"><section className="setup-card"><Brand/><h1>Falta conectar VendeSimple</h1><p>La interfaz está preparada. Para habilitar el registro, necesitamos colocar la URL y la clave pública de tu proyecto Supabase en el archivo <b>.env</b>. Encontrá los pasos en INSTRUCCIONES.md.</p></section></main>;
  if (!session || mode === 'update-password') return <main className="auth-layout"><section className="hero"><Brand/><div className="hero-copy"><span className="eyebrow">TU NEGOCIO, MÁS SIMPLE</span><h1>Tu tienda online.<br/><em>Sin complicaciones.</em></h1><p>Creá tu espacio de venta, organizá tus productos y empezá a recibir pedidos desde un solo lugar.</p><div className="hero-points"><span><Store size={17}/> Tu propia tienda</span><span><Package size={17}/> Tus productos</span><span><ShoppingBag size={17}/> Tus pedidos</span></div></div><small>VendeSimple · Una herramienta para emprender</small></section><section className="auth-panel"><div className="auth-card"><div className="mobile-brand"><Brand/></div><span className="eyebrow">BIENVENIDO/A</span><h2>{mode === 'register' ? 'Creá tu cuenta' : mode === 'reset' ? 'Recuperá tu contraseña' : mode === 'update-password' ? 'Elegí una contraseña nueva' : 'Ingresá a tu cuenta'}</h2><p className="muted">{mode === 'register' ? 'Registrate gratis y prepará tu tienda.' : mode === 'reset' ? 'Te enviaremos un enlace para crear una contraseña nueva.' : mode === 'update-password' ? 'Usá al menos 8 caracteres.' : 'Continuá administrando tu negocio.'}</p><form onSubmit={authenticate}><label>Correo electrónico<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu correo electrónico" autoComplete="email" required/></label>{mode !== 'reset' && <label>{mode === 'update-password' ? 'Nueva contraseña' : 'Contraseña'}<div className="password-wrap"><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} autoComplete={mode==='register' || mode==='update-password'?'new-password':'current-password'} required/><button className="eye" type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="Mostrar contraseña">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}<button className="primary full" disabled={busy}>{busy?'Procesando…':mode==='register'?'Crear cuenta':mode==='reset'?'Enviar enlace':mode==='update-password'?'Guardar contraseña':'Ingresar'} <ArrowRight size={17}/></button></form>{notice&&<div className="notice">{notice}</div>}<p className="switch">{mode==='reset' || mode==='update-password' ? <>¿Querés volver al ingreso? <button type="button" onClick={()=>{setMode('login');setNotice('')}}>Volver a ingresar</button></> : <>{mode==='register'?'¿Ya tenés cuenta?':'¿Todavía no tenés cuenta?'} <button type="button" onClick={()=>{setMode(mode==='register'?'login':'register');setNotice('')}}>{mode==='register'?'Ingresar':'Crear cuenta'}</button></>}</p>{mode==='login' && <p className="switch"><button type="button" onClick={()=>{setMode('reset');setNotice('')}}>Olvidé mi contraseña</button></p>}<p className="fineprint">Al continuar, aceptás nuestros términos y nuestra política de privacidad.</p></div></section></main>;

  return <div className="app-shell"><header className="topbar"><Brand/><div className="top-actions"><span className="user-email">{session.user.email}</span><button className="outline-btn" onClick={signOut}><LogOut size={16}/> Salir</button></div></header><main className="dashboard"><div className="welcome"><div><span className="eyebrow">PANEL DE CONTROL</span><h1>Tu negocio, en marcha.</h1><p className="muted">Administrá tu tienda desde un solo lugar.</p></div><span className="plan-pill">Plan gratuito</span></div>{notice&&<div className="notice">{notice}</div>}
  {!activeBusiness ? <section className="panel create-panel"><div className="panel-icon"><Store/></div><h2>Creá tu primera tienda</h2><p className="muted">Completá estos datos básicos. Después vas a poder agregar tus productos.</p><form onSubmit={createBusiness} className="stack-form"><label>Nombre de tu negocio<input value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="Ej. Mi tienda" required maxLength={80}/></label><label>WhatsApp (opcional)<input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="Código de país + número"/></label><button className="primary" disabled={busy}>{busy?'Creando…':'Crear mi tienda'} <ArrowRight size={17}/></button></form></section> : <><section className="store-card"><div className="store-symbol"><Store/></div><div className="store-info"><span className="eyebrow">TU TIENDA</span><h2>{activeBusiness.name}</h2><p className="muted">Enlace público: {window.location.origin}/tienda/{activeBusiness.slug}</p></div><span className="status-pill">Activa</span></section><div className="section-heading"><div><h2>Productos</h2><p className="muted">Agregá y organizá tu catálogo.</p></div><span className="count-pill">{products.length} productos</span></div><div className="content-grid"><section className="panel"><h3><Plus size={18}/> Agregar producto</h3><form onSubmit={editingProductId ? saveProduct : addProduct} className="stack-form"><label>Nombre del producto<input value={productName} onChange={e=>setProductName(e.target.value)} placeholder="Ej. Taza artesanal" required maxLength={120}/></label><label>Precio<input type="number" min="0" step="0.01" value={productPrice} onChange={e=>setProductPrice(e.target.value)} placeholder="0,00" required/></label><label>Descripción (opcional)<textarea value={productDescription} onChange={e=>setProductDescription(e.target.value)} placeholder="Contá brevemente cómo es el producto." rows="3"/></label><button className="primary" disabled={busy}>{busy?'Guardando…':editingProductId?'Guardar cambios':'Guardar producto'}</button>{editingProductId && <button type="button" className="outline-btn" onClick={()=>{setEditingProductId(null);setProductName('');setProductPrice('');setProductDescription('')}}>Cancelar edición</button>}</form></section><section className="panel"><h3><Package size={18}/> Tu catálogo</h3>{products.length===0?<div className="empty"><ShoppingBag size={28}/><b>Todavía no hay productos</b><span>Cuando agregues uno, aparecerá acá.</span></div>:<div className="product-list">{products.map(p=><div className="product-row" key={p.id}><div><b>{p.name}</b><small>{p.description||'Sin descripción'}</small></div><strong>{new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(p.price)}</strong><div className="product-actions"><button type="button" className="icon-btn" title="Editar producto" onClick={()=>startEditProduct(p)} disabled={busy}><Pencil size={16}/></button><button type="button" className="icon-btn danger" title="Eliminar producto" onClick={()=>deleteProduct(p)} disabled={busy}><Trash2 size={16}/></button></div></div>)}</div>}</section></div></>}
  <footer className="footer"><span>© {new Date().getFullYear()} VendeSimple</span><span><CircleHelp size={14}/> Centro de ayuda próximamente</span></footer></main></div>;
}
function Brand(){return <div className="brand"><span className="brand-mark"><Store size={21}/></span><span>Vende<span>Simple</span></span></div>}

createRoot(document.getElementById('root')).render(<App/>);
