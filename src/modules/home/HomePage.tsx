import { Link } from 'react-router-dom'
import { MapPin, Calendar, BarChart2, Building2, Wrench } from 'lucide-react'

interface ModuleCardProps {
  to: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
  iconColor: string
}

function ModuleCard({ to, icon, title, description, color, iconColor }: ModuleCardProps) {
  return (
    <Link
      to={to}
      className={`group flex flex-col gap-3 rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${color}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
      <span className="mt-auto text-xs font-medium text-blue-600 group-hover:underline">
        Acessar →
      </span>
    </Link>
  )
}

const MODULES: ModuleCardProps[] = [
  {
    to: '/map',
    icon: <MapPin size={20} className="text-blue-700" />,
    title: 'SAGE Map',
    description: 'Grade semanal de todas as salas do departamento, com alocações em tempo real.',
    color: 'bg-white border-blue-100 hover:border-blue-300',
    iconColor: 'bg-blue-50',
  },
  {
    to: '/agenda',
    icon: <Calendar size={20} className="text-violet-700" />,
    title: 'SAGE Agenda',
    description: 'Consulte a grade de horários completa de qualquer professor do departamento.',
    color: 'bg-white border-violet-100 hover:border-violet-300',
    iconColor: 'bg-violet-50',
  },
  {
    to: '/report',
    icon: <BarChart2 size={20} className="text-emerald-700" />,
    title: 'SAGE Report',
    description: 'Relatório de ocupação e disponibilidade de todas as salas por período letivo.',
    color: 'bg-white border-emerald-100 hover:border-emerald-300',
    iconColor: 'bg-emerald-50',
  },
  {
    to: '/auditorio',
    icon: <Building2 size={20} className="text-amber-700" />,
    title: 'SAGE Auditório',
    description: 'Calendário mensal de reservas do auditório com relatório de utilização.',
    color: 'bg-white border-amber-100 hover:border-amber-300',
    iconColor: 'bg-amber-50',
  },
  {
    to: '/manutencao',
    icon: <Wrench size={20} className="text-orange-700" />,
    title: 'SAGE Manutenção',
    description: 'Lista de solicitações de manutenção (RTs) com filtros e status atualizado.',
    color: 'bg-white border-orange-100 hover:border-orange-300',
    iconColor: 'bg-orange-50',
  },
]

export function HomePage() {
  return (
    <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
          SAGE
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Sistema de Alocação e Gestão de Espaços
          <br />
          <span className="text-sm">Departamento de Computação · UFRPE</span>
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {MODULES.map((m) => (
          <ModuleCard key={m.to} {...m} />
        ))}
      </div>
    </main>
  )
}
