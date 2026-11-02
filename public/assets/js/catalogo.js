(function () {
  'use strict';

  const TOKEN_KEY = 'token_crud_productos';
  const USER_KEY = 'usuario_crud_productos';

  function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = String(texto ?? '');
    return div.innerHTML;
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch (e) {
      return null;
    }
  }

  function setSession(token, usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function mostrarMensaje(el, texto, tipo) {
    if (!el) return;
    el.textContent = texto;
    el.className = 'mensaje visible ' + (tipo === 'exito' ? 'exito' : 'error');
  }

  function ocultarMensaje(el) {
    if (!el) return;
    el.className = 'mensaje';
    el.textContent = '';
  }

  async function apiFetch(ruta, opciones) {
    opciones = opciones || {};
    const headers = Object.assign({}, opciones.headers || {});
    const token = getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    if (opciones.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(ruta, {
      method: opciones.method || 'GET',
      headers,
      body: opciones.body ? (typeof opciones.body === 'string' ? opciones.body : JSON.stringify(opciones.body)) : undefined,
    });

    if (res.status === 401) {
      // Token expirado o inválido: cerrar sesión
      clearSession();
      window.location.href = 'index.html';
      throw new Error('Sesión expirada');
    }

    let data = null;
    const text = await res.text();
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    return { status: res.status, data };
  }

  function debounce(fn, delay) {
    let timer;
    return function () {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  // ---------- LOGIN ----------
  const formLogin = document.getElementById('formLogin');
  if (formLogin) {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        document.getElementById('formLogin').classList.toggle('oculto', tab !== 'login');
        document.getElementById('formRegister').classList.toggle('oculto', tab !== 'register');
      });
    });

    // Toggle password visibility
    document.querySelectorAll('.toggle-pass').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = document.getElementById(btn.getAttribute('data-target'));
        if (!target) return;
        target.type = target.type === 'password' ? 'text' : 'password';
        btn.textContent = target.type === 'password' ? '👁' : '🙈';
      });
    });

    formLogin.addEventListener('submit', async function (e) {
      e.preventDefault();
      const msg = document.getElementById('mensajeLogin');
      ocultarMensaje(msg);

      const usuario = document.getElementById('loginUsuario').value.trim();
      const contrasena = document.getElementById('loginContrasena').value;

      const btn = document.getElementById('btnLogin');
      btn.disabled = true;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, contraseña: contrasena, contrasena: contrasena }),
        });
        const data = await res.json().catch(function () { return null; });

        if (res.ok && data && data.token) {
          setSession(data.token, data.usuario);
          window.location.href = 'productos.html';
        } else {
          mostrarMensaje(msg, (data && data.mensaje) || 'Credenciales incorrectas.', 'error');
        }
      } catch (err) {
        mostrarMensaje(msg, 'Error de conexión con el servidor.', 'error');
      } finally {
        btn.disabled = false;
      }
    });

    // Registro
    const formRegister = document.getElementById('formRegister');
    if (formRegister) {
      formRegister.addEventListener('submit', async function (e) {
        e.preventDefault();
        const msg = document.getElementById('mensajeRegister');
        ocultarMensaje(msg);

        const usuario = document.getElementById('regUsuario').value.trim();
        const contrasena = document.getElementById('regContrasena').value;
        const contrasena2 = document.getElementById('regContrasena2').value;

        if (contrasena !== contrasena2) {
          mostrarMensaje(msg, 'Las contraseñas no coinciden.', 'error');
          return;
        }

        const btn = document.getElementById('btnRegister');
        btn.disabled = true;

        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, contraseña: contrasena, contrasena: contrasena }),
          });
          const data = await res.json().catch(function () { return null; });

          if (res.status === 201 && data && data.token) {
            setSession(data.token, data.usuario);
            mostrarMensaje(msg, '¡Cuenta creada! Redirigiendo...', 'exito');
            setTimeout(function () { window.location.href = 'productos.html'; }, 800);
          } else {
            mostrarMensaje(msg, (data && data.mensaje) || 'No se pudo registrar.', 'error');
          }
        } catch (err) {
          mostrarMensaje(msg, 'Error de conexión con el servidor.', 'error');
        } finally {
          btn.disabled = false;
        }
      });
    }
  }

  // ---------- PANEL ----------
  const listado = document.getElementById('listado');
  if (listado) {
    // Proteger vista
    if (!getToken()) {
      window.location.href = 'index.html';
      return;
    }

    const usuario = getUser();
    const spanUser = document.getElementById('usuarioActual');
    if (spanUser && usuario) {
      spanUser.textContent = usuario.usuario || '';
    }

    const msgBox = document.getElementById('mensajes');

    function mostrarMsg(texto, tipo) {
      const div = document.createElement('div');
      div.className = 'mensaje visible ' + (tipo === 'exito' ? 'exito' : 'error');
      div.textContent = texto;
      msgBox.appendChild(div);
      setTimeout(function () { div.remove(); }, 4000);
    }

    async function cargarEstadisticas() {
      try {
        const r = await apiFetch('/api/productos/estadisticas');
        if (r.status === 200 && r.data && r.data.data) {
          const d = r.data.data;
          document.getElementById('statTotal').textContent = d.totalProductos;
          document.getElementById('statUnidades').textContent = d.unidadesDisponibles;
          document.getElementById('statValor').textContent = '$' + Number(d.valorInventario).toFixed(2);
          document.getElementById('statBajo').textContent = d.stockBajo;
        }
      } catch (e) { /* redirigido */ }
    }

    async function cargarProductos(buscar) {
      listado.innerHTML = '<p class="cargando">Cargando productos...</p>';
      try {
        const q = buscar ? '?buscar=' + encodeURIComponent(buscar) : '';
        const r = await apiFetch('/api/productos' + q);
        if (r.status !== 200) {
          listado.innerHTML = '<p class="vacio">Error al cargar productos.</p>';
          return;
        }
        const productos = (r.data && r.data.data) || [];
        if (productos.length === 0) {
          listado.innerHTML = '<p class="vacio">No hay productos para mostrar.</p>';
          return;
        }
        listado.innerHTML = productos.map(function (p) {
          const stockClass = p.stock <= 5 ? 'stock-bajo' : 'stock-ok';
          return `
            <article class="producto-card">
              <h3>${escapeHtml(p.nombre)}</h3>
              <div class="producto-meta">${escapeHtml(p.categoria || 'Sin categoría')}</div>
              <p class="producto-meta">${escapeHtml(p.descripcion || '')}</p>
              <div class="producto-precio">$${Number(p.precio).toFixed(2)}</div>
              <div class="producto-stock ${stockClass}">Stock: ${escapeHtml(p.stock)}</div>
              <div class="producto-actions">
                <button class="btn btn-ghost btn-small btn-editar" data-id="${escapeHtml(p.id)}">Editar</button>
                <button class="btn btn-danger btn-small btn-eliminar" data-id="${escapeHtml(p.id)}" data-nombre="${escapeHtml(p.nombre)}">Eliminar</button>
              </div>
            </article>
          `;
        }).join('');

        // Eventos editar/eliminar
        listado.querySelectorAll('.btn-editar').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const id = btn.getAttribute('data-id');
            const prod = productos.find(function (x) { return x.id === id; });
            if (prod) abrirFormulario(prod);
          });
        });
        listado.querySelectorAll('.btn-eliminar').forEach(function (btn) {
          btn.addEventListener('click', async function () {
            const id = btn.getAttribute('data-id');
            const nombre = btn.getAttribute('data-nombre');
            if (!confirm('¿Eliminar el producto "' + nombre + '"?')) return;
            try {
              const r = await apiFetch('/api/productos/' + encodeURIComponent(id), { method: 'DELETE' });
              if (r.status === 204) {
                mostrarMsg('Producto eliminado correctamente.', 'exito');
                await cargarProductos(document.getElementById('buscador').value);
                await cargarEstadisticas();
              } else {
                mostrarMsg((r.data && r.data.mensaje) || 'No se pudo eliminar.', 'error');
              }
            } catch (e) { /* redirigido */ }
          });
        });
      } catch (e) { /* redirigido */ }
    }

    const formSection = document.getElementById('formSection');
    const formProducto = document.getElementById('formProducto');
    const formTitulo = document.getElementById('formTitulo');

    function abrirFormulario(prod) {
      formSection.classList.remove('oculto');
      if (prod) {
        formTitulo.textContent = 'Editar producto';
        document.getElementById('productoId').value = prod.id;
        document.getElementById('nombre').value = prod.nombre || '';
        document.getElementById('precio').value = prod.precio;
        document.getElementById('stock').value = prod.stock;
        document.getElementById('categoria').value = prod.categoria || '';
        document.getElementById('descripcion').value = prod.descripcion || '';
      } else {
        formTitulo.textContent = 'Nuevo producto';
        formProducto.reset();
        document.getElementById('productoId').value = '';
      }
      formSection.scrollIntoView({ behavior: 'smooth' });
    }

    function cerrarFormulario() {
      formSection.classList.add('oculto');
      formProducto.reset();
      document.getElementById('productoId').value = '';
    }

    document.getElementById('btnNuevo').addEventListener('click', function () {
      abrirFormulario(null);
    });

    document.getElementById('btnCancelar').addEventListener('click', function () {
      cerrarFormulario();
    });

    formProducto.addEventListener('submit', async function (e) {
      e.preventDefault();
      const id = document.getElementById('productoId').value;
      const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        precio: parseFloat(document.getElementById('precio').value),
        categoria: document.getElementById('categoria').value.trim(),
        stock: parseInt(document.getElementById('stock').value, 10),
      };

      const btn = document.getElementById('btnGuardar');
      btn.disabled = true;
      try {
        let r;
        if (id) {
          r = await apiFetch('/api/productos/' + encodeURIComponent(id), {
            method: 'PUT',
            body: datos,
          });
        } else {
          r = await apiFetch('/api/productos', {
            method: 'POST',
            body: datos,
          });
        }

        if (r.status === 200 || r.status === 201) {
          mostrarMsg(id ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.', 'exito');
          cerrarFormulario();
          await cargarProductos(document.getElementById('buscador').value);
          await cargarEstadisticas();
        } else {
          mostrarMsg((r.data && r.data.mensaje) || 'Error al guardar.', 'error');
        }
      } catch (e) { /* redirigido */ }
      finally {
        btn.disabled = false;
      }
    });

    const buscador = document.getElementById('buscador');
    const buscarDebounced = debounce(function () {
      cargarProductos(buscador.value);
    }, 300);
    buscador.addEventListener('input', buscarDebounced);

    document.getElementById('btnCerrarSesion').addEventListener('click', function () {
      clearSession();
      window.location.href = 'index.html';
    });

    // Carga inicial
    cargarEstadisticas();
    cargarProductos('');
  }
})();
