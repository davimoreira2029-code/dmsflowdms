import Link from "next/link";
import { listActivePlans } from "@/server/services/billing.service";

const PROBLEMAS = [
  {
    titulo: "A operação vive em planilhas",
    texto:
      "Cada funcionário guarda o que sabe em uma planilha diferente, num caderno, ou só na cabeça. Quando alguém falta, a informação some junto.",
  },
  {
    titulo: "Nada conversa com nada",
    texto:
      "O controle de veículos não fala com o de estoque. O checklist do velório não avisa quando falta urna. Cada problema vira um telefonema.",
  },
  {
    titulo: "Ninguém sabe o que está pendente",
    texto:
      "Um serviço fica parado esperando um item que ninguém marcou como faltando. O gestor só descobre quando a família liga perguntando.",
  },
];

const FUNCIONALIDADES = [
  { nome: "Serviços", descricao: "Da abertura à finalização, com histórico completo de cada etapa e quem fez o quê." },
  { nome: "Checklists", descricao: "Modelos reutilizáveis por tipo de serviço — nada obrigatório fica pendente sem ninguém perceber." },
  { nome: "Veículos", descricao: "Quilometragem, manutenção e disponibilidade em tempo real, sem depender de memória." },
  { nome: "Estoque", descricao: "Urnas, EPIs e materiais com alerta automático quando algo está acabando." },
  { nome: "Equipe e tarefas", descricao: "Quem é responsável por quê, com prazo, prioridade e notificação de atraso." },
  { nome: "Relatórios", descricao: "Números reais de produtividade, uso de frota e estoque — exportáveis, sem planilha manual." },
];

const PASSOS = [
  { titulo: "Cadastre sua empresa", texto: "Nome, CNPJ e endereço. Sete dias de teste, sem cartão de crédito." },
  { titulo: "Configure sua equipe", texto: "Adicione funcionários e defina o que cada um pode ver e fazer." },
  { titulo: "Comece a registrar", texto: "Primeiro serviço, primeiro checklist. A operação já fica rastreada no mesmo dia." },
];

const FAQ = [
  {
    pergunta: "Preciso instalar alguma coisa?",
    resposta: "Não. O DMS FLOW roda no navegador, em qualquer computador ou celular com internet.",
  },
  {
    pergunta: "Meus dados ficam salvos mesmo se eu parar de usar por um tempo?",
    resposta:
      "Sim. Mesmo que sua assinatura vença, seus dados continuam guardados — nunca apagamos nada automaticamente.",
  },
  {
    pergunta: "Dá para usar em mais de uma unidade da funerária?",
    resposta: "Cada empresa tem seu próprio ambiente isolado. Unidades adicionais dependem do plano contratado.",
  },
  {
    pergunta: "Como funciona o período de teste?",
    resposta: "Sete dias com acesso completo aos módulos do plano Starter, sem precisar cadastrar cartão.",
  },
];

export default async function LandingPage() {
  // A landing page é a porta de entrada de novos clientes — não pode
  // cair inteira só porque a consulta de preços falhou momentaneamente.
  // Em caso de erro, a seção de planos mostra uma mensagem alternativa
  // em vez de quebrar a página inteira.
  const plans = await listActivePlans().catch(() => []);

  return (
    <main className="bg-white text-navy-950">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg text-navy-950">DMS FLOW</span>
          <nav className="hidden items-center gap-8 text-sm text-neutral-600 sm:flex">
            <a href="#funcionalidades" className="hover:text-navy-950">Funcionalidades</a>
            <a href="#planos" className="hover:text-navy-950">Planos</a>
            <a href="#faq" className="hover:text-navy-950">Perguntas frequentes</a>
          </nav>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-neutral-600 hover:text-navy-950">Entrar</Link>
            <Link href="/registro" className="rounded-md bg-navy-950 px-4 py-2 font-medium text-white hover:bg-navy-900">
              Testar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <div className="grid gap-12 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <h1 className="font-display text-4xl leading-tight text-navy-950 sm:text-5xl">
              A operação da sua funerária, organizada num só lugar.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-600">
              O DMS FLOW substitui planilhas soltas, cadernos e ligações de última hora por um sistema
              único que sua equipe já sabe usar no primeiro dia.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/registro"
                className="rounded-md bg-navy-950 px-6 py-3 text-sm font-medium text-white hover:bg-navy-900"
              >
                Testar gratuitamente por 7 dias
              </Link>
              <a href="#funcionalidades" className="text-sm font-medium text-navy-950 underline underline-offset-4">
                Ver o que o sistema faz
              </a>
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="rounded-lg border border-neutral-200 bg-navy-950 p-6 text-white">
              <p className="text-xs uppercase tracking-wide text-gold-300">Hoje na Funerária Demo</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <dt className="text-neutral-300">Serviços em andamento</dt>
                  <dd className="font-medium">4</dd>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <dt className="text-neutral-300">Checklists pendentes</dt>
                  <dd className="font-medium text-gold-300">2</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-300">Estoque abaixo do mínimo</dt>
                  <dd className="font-medium text-gold-300">1 item</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-display text-2xl text-navy-950 sm:text-3xl">
            Você reconhece esses problemas?
          </h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {PROBLEMAS.map((p) => (
              <div key={p.titulo}>
                <h3 className="font-medium text-navy-950">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-2xl text-navy-950 sm:text-3xl">O que o DMS FLOW organiza</h2>
        <div className="mt-10 divide-y divide-neutral-200 border-t border-neutral-200">
          {FUNCIONALIDADES.map((f) => (
            <div key={f.nome} className="grid gap-2 py-5 sm:grid-cols-4 sm:items-baseline sm:gap-6">
              <p className="font-medium text-navy-950 sm:col-span-1">{f.nome}</p>
              <p className="text-sm text-neutral-600 sm:col-span-3">{f.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona — sequência real, numeração se justifica */}
      <section className="border-t border-neutral-200 bg-navy-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-display text-2xl sm:text-3xl">Como começar</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {PASSOS.map((passo, i) => (
              <div key={passo.titulo}>
                <p className="font-display text-3xl text-gold-300">{i + 1}</p>
                <h3 className="mt-3 font-medium">{passo.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-300">{passo.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos — preço real do banco */}
      <section id="planos" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-2xl text-navy-950 sm:text-3xl">Planos</h2>
        <p className="mt-2 text-sm text-neutral-600">Sem taxa de adesão. Cancele quando quiser.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border border-neutral-200 p-6">
              <p className="font-medium text-navy-950">{plan.nome}</p>
              <p className="mt-3 font-display text-3xl text-navy-950">
                R$ {(plan.precoCentavos / 100).toFixed(0)}
                <span className="text-sm font-sans font-normal text-neutral-500">/mês</span>
              </p>
              <p className="mt-2 text-xs text-neutral-500">Até {plan.limiteUsuarios} usuários</p>
              <Link
                href="/registro"
                className="mt-6 block rounded-md border border-navy-950 px-4 py-2 text-center text-sm font-medium text-navy-950 hover:bg-navy-950 hover:text-white"
              >
                Começar
              </Link>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="text-sm text-neutral-500 sm:col-span-4">
              Não foi possível carregar os planos agora. Entre em contato ou tente novamente em instantes.
            </p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="font-display text-2xl text-navy-950 sm:text-3xl">Perguntas frequentes</h2>
          <div className="mt-10 divide-y divide-neutral-200 border-t border-neutral-200">
            {FAQ.map((item) => (
              <details key={item.pergunta} className="group py-5">
                <summary className="cursor-pointer list-none font-medium text-navy-950 marker:content-none">
                  {item.pergunta}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="font-display text-2xl text-navy-950 sm:text-3xl">
          Organize sua operação a partir de hoje
        </h2>
        <Link
          href="/registro"
          className="mt-6 inline-block rounded-md bg-navy-950 px-6 py-3 text-sm font-medium text-white hover:bg-navy-900"
        >
          Testar gratuitamente por 7 dias
        </Link>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-neutral-500">
          © {new Date().getFullYear()} DMS FLOW. Todos os direitos reservados.
        </div>
      </footer>
    </main>
  );
}
