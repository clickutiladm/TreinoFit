TreinoFit - Projeto pronto para deploy (Vite + React)

Como usar:

1) Baixe e extraia este arquivo.
2) No terminal, entre na pasta do projeto:
   cd treinofit
3) Instale dependências:
   npm install
4) Rode em modo desenvolvimento:
   npm run dev
5) Para criar build para produção:
   npm run build
   A pasta de saída será 'dist' (usada pela Vercel/Netlify).

Funcionalidades:
- Criar treinos
- Importar arquivo .pdf/.doc/.docx (arquivo é lido e salvo no storage)
- Registrar sessões no diário
- Timer de descanso
- Gráfico de evolução (volume estimado)

OBS: Para ver arquivos .docx no navegador, alguns navegadores não abrem diretamente; o app fornece um link para baixar/abrir o arquivo importado.
