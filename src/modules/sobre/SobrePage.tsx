import { Link } from 'react-router-dom'
import { PageShell } from '../../components/Layout/PageShell'
import { MapPin, Calendar, BarChart2, Building2, Wrench, Mail } from 'lucide-react'

interface ModuleCardProps {
  icon: React.ReactNode
  title: string
  route: string
  color: string
  description: string
  features: string[]
}

function ModuleCard({ icon, title, route, color, description, features }: ModuleCardProps) {
  return (
    <div className={`bg-white border rounded-xl overflow-hidden shadow-sm`}>
      <div className={`px-5 py-4 border-b ${color}`}>
        <div className="flex items-center gap-2.5">
          {icon}
          <div>
            <h2 className="font-bold text-base">{title}</h2>
            <code className="text-xs opacity-70">{route}</code>
          </div>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <ul className="space-y-1.5">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
      <div className="px-5 pb-4">
        <Link
          to={route}
          className="inline-block text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          Acessar módulo →
        </Link>
      </div>
    </div>
  )
}

const MODULES: ModuleCardProps[] = [
  {
    icon: <MapPin size={20} className="text-blue-700" />,
    title: 'SAGE Map',
    route: '/map',
    color: 'bg-blue-50 border-blue-100 text-blue-900',
    description:
      'Visualize a agenda semanal de cada sala do departamento em formato de grade, de segunda a sábado, das 07:00 às 22:00.',
    features: [
      'Selecione qualquer sala para ver sua grade da semana',
      'Clique em uma alocação para ver os detalhes: disciplina, professor, sala e horário',
      'As salas são coloridas por tipo: salas de aula (azul), inovação (roxo) e laboratórios (verde)',
      'Aba "Buscar Sala": localize disciplinas e professores com autocomplete e veja todas as salas e horários',
      'A grade é atualizada automaticamente em tempo real',
      'Filtre os dados pelo período letivo usando o seletor no topo da página',
    ],
  },
  {
    icon: <Calendar size={20} className="text-violet-700" />,
    title: 'SAGE Agenda',
    route: '/agenda',
    color: 'bg-violet-50 border-violet-100 text-violet-900',
    description:
      'Consulte a grade de horários completa de um professor, com todas as disciplinas e salas onde ele leciona no período.',
    features: [
      'Digite o nome do professor no campo de busca para filtrar por autocomplete',
      'A grade semanal exibe disciplina e sala para cada horário do professor',
      'Clique em uma alocação para ver todos os detalhes',
      'Compartilhe a consulta via link direto: /#/agenda?professor=NOME',
    ],
  },
  {
    icon: <BarChart2 size={20} className="text-emerald-700" />,
    title: 'SAGE Report',
    route: '/report',
    color: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    description:
      'Acompanhe o percentual de ocupação de todas as salas do departamento no período letivo selecionado.',
    features: [
      'Gráfico de barras com o percentual de ocupação de cada sala',
      'Clique em uma sala para ver o detalhamento por dia da semana',
      'Salas agrupadas por tipo: salas de aula, inovação e laboratórios',
      'Base de cálculo: 12 horas por dia equivalem a 100% de ocupação',
    ],
  },
  {
    icon: <Building2 size={20} className="text-amber-700" />,
    title: 'SAGE Auditório',
    route: '/auditorio',
    color: 'bg-amber-50 border-amber-100 text-amber-900',
    description:
      'Consulte o calendário de reservas do auditório do Departamento de Computação e o relatório mensal de utilização.',
    features: [
      'Calendário mensal exibindo segunda a sábado, iniciando no mês atual',
      'Navegue entre meses com os botões de anterior e próximo',
      'Clique em uma reserva para ver responsável, data e horário',
      'Aba "Relatório": gráfico e tabela com ocupação diária e mensal (12h = 100%)',
      'Para solicitar uma reserva, envie e-mail para diretoria.dc@ufrpe.br',
    ],
  },
  {
    icon: <Wrench size={20} className="text-orange-700" />,
    title: 'SAGE Manutenção',
    route: '/manutencao',
    color: 'bg-orange-50 border-orange-100 text-orange-900',
    description:
      'Acompanhe as solicitações de manutenção (RTs) do Departamento de Computação, com status atualizado em tempo real.',
    features: [
      'Lista completa das solicitações com número da RT, local, descrição e status',
      'Filtre as solicitações por número da RT, local ou descrição simultaneamente',
      'Clique em uma solicitação para ver todos os detalhes, incluindo datas e observações',
      'Status visual por cor: Aberto (vermelho), Em andamento (amarelo), Concluído (verde)',
      'Atualização automática em tempo real via Supabase Realtime',
    ],
  },
]

export function SobrePage() {
  return (
    <PageShell
      title="Sobre o SAGE"
      subtitle="Sistema de Alocação e Gestão de Espaços — Departamento de Computação / UFRPE"
    >
      <div className="max-w-3xl">
        <p className="text-sm text-gray-600 mb-8">
          O SAGE centraliza a visualização e gestão dos espaços do Departamento de Computação da UFRPE.
          Todos os módulos abaixo são de acesso público — nenhum cadastro é necessário para consultar as informações.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          {MODULES.map((m) => (
            <ModuleCard key={m.route} {...m} />
          ))}
        </div>

        <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-600">
          <Mail size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
          <span>
            Para reservas no auditório ou outras solicitações, entre em contato com a direção do departamento pelo e-mail{' '}
            <a href="mailto:diretoria.dc@ufrpe.br" className="font-medium text-blue-600 hover:underline">
              diretoria.dc@ufrpe.br
            </a>.
          </span>
        </div>
      </div>
    </PageShell>
  )
}
