import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import { Loader } from './components/ui';
import { AuthPage, Landing } from './pages/PublicPages';
import { ProfilePage, TripOverview, TripsPage } from './pages/TripPages';
import { ActivityDetailPage, AiPage, ExpenseDetailPage, ExpensesPage, FinancePage, FundPage, ItineraryPage, MembersPage, NotificationsPage, PaymentDetailPage, RemindersPage, SettlementsPage } from './pages/FeaturePages';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader label="Đang mở UsTrip..."/>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Landing/>}/>
    <Route path="/login" element={<AuthPage mode="login"/>}/>
    <Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route element={<Protected><Layout/></Protected>}>
      <Route path="/app" element={<TripsPage/>}/>
      <Route path="/notifications" element={<NotificationsPage/>}/>
      <Route path="/profile" element={<ProfilePage/>}/>
      <Route path="/trips/:tripId" element={<TripOverview/>}/>
      <Route path="/trips/:tripId/itinerary" element={<ItineraryPage/>}/>
      <Route path="/trips/:tripId/activities/:activityId" element={<ActivityDetailPage/>}/>
      <Route path="/trips/:tripId/members" element={<MembersPage/>}/>
      <Route path="/trips/:tripId/fund" element={<FundPage/>}/>
      <Route path="/trips/:tripId/payments/:paymentId" element={<PaymentDetailPage/>}/>
      <Route path="/trips/:tripId/expenses" element={<ExpensesPage/>}/>
      <Route path="/trips/:tripId/expenses/:expenseId" element={<ExpenseDetailPage/>}/>
      <Route path="/trips/:tripId/settlements" element={<SettlementsPage/>}/>
      <Route path="/trips/:tripId/finance" element={<FinancePage/>}/>
      <Route path="/trips/:tripId/reminders" element={<RemindersPage/>}/>
      <Route path="/trips/:tripId/ai" element={<AiPage/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
