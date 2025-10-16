-- CreateTable
CREATE TABLE "public"."Categoria" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Noticia" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "imagemUrl" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "dataPublicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "curtidas" INTEGER NOT NULL DEFAULT 0,
    "categoria_id" INTEGER NOT NULL,

    CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Interacao" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "conteudo" TEXT,
    "nota" INTEGER,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cliente_id" TEXT NOT NULL,
    "noticia_id" INTEGER NOT NULL,
    "resposta" TEXT,

    CONSTRAINT "Interacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "public"."Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "public"."Cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- AddForeignKey
ALTER TABLE "public"."Noticia" ADD CONSTRAINT "Noticia_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Interacao" ADD CONSTRAINT "Interacao_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Interacao" ADD CONSTRAINT "Interacao_noticia_id_fkey" FOREIGN KEY ("noticia_id") REFERENCES "public"."Noticia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
