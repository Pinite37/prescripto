import { Navigate } from 'react-router-dom';

// Composant pour gérer la redirection selon le token
const HomeRedirect = () => {
  // Récupérer les tokens (depuis localStorage, par exemple)
  const aToken = localStorage.getItem('aToken');
  const dToken = localStorage.getItem('dToken');

  if (aToken) {
    return <Navigate to="/admin-dashboard" />;
  } else if (dToken) {
    return <Navigate to="/doctor-dashboard" />;
  } else {
    // Si aucun token n'est présent, rediriger vers une page de connexion ou une erreur
    return <Navigate to="/login" />;
  }
}

export default HomeRedirect