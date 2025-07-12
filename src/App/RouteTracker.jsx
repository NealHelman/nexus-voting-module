import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';

export default function RouteTracker() {
  const location = useLocation();
  const dispatch = useDispatch();

  React.useEffect(() => {
    // Only update lastVisitedPath if not restoring (i.e., not a programmatic redirect)
    if (!location.state || !location.state.restoring) {
      dispatch({
        type: 'SET_LAST_VISITED_PATH',
        payload: location.pathname + location.search,
      });
    }
  }, [location, dispatch]);

  return null;
}