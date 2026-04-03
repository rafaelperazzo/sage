import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PeriodoProvider } from './contexts/PeriodoContext'
import { Header } from './components/Layout/Header'
import { MapPage } from './modules/map/MapPage'
import { AgendaPage } from './modules/agenda/AgendaPage'
import { ReportPage } from './modules/report/ReportPage'
import { LoginPage } from './modules/auth/LoginPage'
import { AuditorioPage } from './modules/auditorio/AuditorioPage'
import { ManutencaoPage } from './modules/manutencao/ManutencaoPage'
import { SobrePage } from './modules/sobre/SobrePage'
import { HomePage } from './modules/home/HomePage'

export function App() {
  return (
    <HashRouter>
      <PeriodoProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/auditorio" element={<AuditorioPage />} />
            <Route path="/manutencao" element={<ManutencaoPage />} />
            <Route path="/sobre" element={<SobrePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        </div>
      </PeriodoProvider>
    </HashRouter>
  )
}
