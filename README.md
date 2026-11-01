# NEOPAD

Player de música para navegador e celular, com pads tocáveis, faixas geradas ao vivo, importação dos seus próprios arquivos e catálogo livre via Jamendo. Funciona como PWA: dá para instalar no Android direto do Chrome e usar offline.

Sem build, sem dependências, sem backend. É HTML, CSS e JavaScript puro.

## Recursos

- **Player completo**: play/pause, anterior/próxima, barra de progresso arrastável, volume, aleatório, repetir, fila lateral e visualizador de espectro.
- **36 faixas geradas ao vivo** em 6 coleções (lo-fi, house, ambiente, synthwave, techno, neo-soul). O áudio é sintetizado com Web Audio no navegador, sem nenhum arquivo de áudio no projeto.
- **Pads tocáveis** na tela inicial, por clique, toque ou teclado (`1 2 3 4 / Q W E R / A S D F / Z X C V`).
- **Biblioteca local**: importe MP3, M4A, WAV, FLAC, OGG e Opus. Título, artista e capa são lidos das tags ID3, e os arquivos ficam no IndexedDB do navegador, sem sair do aparelho.
- **Jamendo**: catálogo de música com licença livre, com busca e faixas em alta.
- **Curtidas**, busca, tema claro/escuro e layout responsivo para celular.
- **PWA**: manifesto, ícones e service worker para instalar e abrir offline.

## Rodando localmente

Service workers e IndexedDB exigem `http://` ou `https://`, então abrir o `index.html` com duplo clique não instala o PWA. Sirva a pasta com qualquer servidor estático:

```bash
python3 -m http.server 8080
# ou
npx serve .
```

Depois abra `http://localhost:8080`.

## Estrutura

```
.
├── index.html            # estrutura da página
├── css/styles.css        # estilos e tokens de tema
├── js/
│   ├── app.js            # motor de áudio, interface, biblioteca local, Jamendo
│   └── pwa.js            # registro do service worker e botão de instalar
├── sw.js                 # service worker (cache do app para uso offline)
├── manifest.json         # manifesto PWA
├── icons/                # ícones 192, 512, maskable e apple-touch
├── games/fight/          # NEOPAD FIGHT, jogo de luta em canvas (independente)
├── docs/                 # política de privacidade e ficha da loja
└── .github/workflows/    # deploy automático no GitHub Pages
```

## Configurando o Jamendo

1. Crie uma conta gratuita em [devportal.jamendo.com](https://devportal.jamendo.com/) e registre um app para obter o **Client ID**.
2. No NEOPAD, clique no ícone de música no topo, cole o Client ID e salve.

O Client ID fica só no `localStorage` do seu navegador, nunca no código nem no repositório.

## Publicando no GitHub Pages

O workflow em `.github/workflows/pages.yml` publica o site a cada push na branch `main`. É preciso ativar uma vez:

1. No GitHub, vá em **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.

O site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`. Todos os caminhos do projeto são relativos, então funciona em subpasta sem ajuste.

## Do site ao app da Play Store

Com o site publicado em HTTPS, use o [PWABuilder](https://www.pwabuilder.com/) para gerar o pacote Android (.aab). A Play Store cobra uma taxa única de US$ 25 para a conta de desenvolvedor e exige uma URL pública para a política de privacidade (`docs/politica-de-privacidade.md`, que você pode hospedar nas próprias Pages). Os textos da ficha da loja estão em `docs/ficha-da-loja.md`.

## Limites conhecidos

- A busca do Jamendo precisa de rede aberta. Em previews que bloqueiam requisições externas ela mostra um aviso em vez de resultados.
- Os arquivos importados ficam por navegador e por aparelho. Não há sincronização entre dispositivos.
- Navegadores limitam o espaço do IndexedDB. Se recusar, o app avisa e mantém a faixa só na sessão.

## Licença

[MIT](LICENSE).
