import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

export default function RestoreLastPage() {
  const rehydrated = useSelector(state => state._persist?.rehydrated);
  const lastVisitedPath = useSelector(state => state.ui.lastVisitedPath);
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  React.useEffect(() => {
    if (
      rehydrated &&
      lastVisitedPath &&
      location.pathname + location.search !== lastVisitedPath &&
      !hasRedirected.current
    ) {
      hasRedirected.current = true;
      navigate(lastVisitedPath, { replace: true, state: { restoring: true } });
    }
  }, [rehydrated, lastVisitedPath, location, navigate]);

  return null;
}