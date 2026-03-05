# Como agregar las fotos de los idols

Las fotos van en: `client/public/images/idols/`

## Lista de archivos necesarios

| Archivo       | Idol     | Grupo       |
|---------------|----------|-------------|
| jin.jpg       | Jin      | BTS         |
| jungkook.jpg  | Jungkook | BTS         |
| taehyung.jpg  | V        | BTS         |
| jimin.jpg     | Jimin    | BTS         |
| momo.jpg      | Momo     | TWICE       |
| nayeon.jpg    | Nayeon   | TWICE       |
| lisa.jpg      | Lisa     | BLACKPINK   |
| jennie.jpg    | Jennie   | BLACKPINK   |
| felix.jpg     | Felix    | Stray Kids  |
| hyunjin.jpg   | Hyunjin  | Stray Kids  |
| karina.jpg    | Karina   | aespa       |
| winter.jpg    | Winter   | aespa       |

## Requisitos de las fotos

- Formato: JPG (preferido), PNG tambien funciona (pero cambia el nombre en idols.js)
- Tamano minimo: 300x300 pixeles
- Forma: cuadrada (se recorta automaticamente con object-cover)
- Peso: tratar de mantener < 150KB por imagen (para que cargue rapido en el celular)

## Donde buscarlas

- **kprofiles.com** — fotos de perfil de cada idol, generalmente cuadradas y limpias
- **Google Imagenes** — buscar "[nombre] [grupo] kpop profile" y filtrar por tamano grande
- **Sitios oficiales de los grupos** — maxima calidad

## Como optimizarlas (opcional pero recomendado)

Ir a **squoosh.app** (gratis, en el navegador):
1. Arrastrar la foto
2. Elegir formato "MozJPEG"
3. Bajar calidad a ~75-80%
4. Descargar

## Cambiar los idols (opcional)

Si queres usar otros idols, edita `client/src/data/idols.js`:

```js
export const IDOLS = [
  { id: 'nombre-grupo', name: 'Nombre', group: 'Grupo', image: 'archivo.jpg' },
  // ... 12 entradas en total (12 pares = 24 cartas)
]
```

## Verificar que todo funciona

```bash
cd client
npm run dev
```

Abrir http://localhost:5173, crear sala y verificar que las cartas muestran las fotos correctamente.

## Hacer deploy con las fotos

Una vez que las fotos esten en la carpeta, hacer push:

```bash
git add client/public/images/idols/
git commit -m "feat: add idol photos"
git push
```

Vercel va a redeployar automaticamente.
