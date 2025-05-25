// --- Pages: VotingPage.jsx ---
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVotes } from '../features/voteSlice';
import { Link } from 'react-router-dom';
import { MIN_TRUST_WEIGHT } from '../constants';
import { decompressFromUTF16 } from 'lz-string';

export const VotingPage = () => {
  const dispatch = useDispatch();
  const { votes: rawVotes, loading } = useSelector((state) => state.voting);
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [userTrust, setUserTrust] = useState(0);

  const votes = rawVotes.map(vote => {
    try {
      const decompressed = JSON.parse(decompressFromUTF16(vote.config || ''));
      return { ...vote, ...decompressed };
    } catch {
      return vote;
    }
  });

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const genesis = window?.USER?.genesis;
        if (!genesis) return;
        const res = await fetch(`${BACKEND_BASE}/subscription-status/${genesis}`);
        const data = await res.json();
        setSubscribed(data.subscribed);
      } catch (e) {
        console.error('Failed to check subscription status:', e);
      }
    };
    checkSubscriptionStatus();
    dispatch(fetchVotes());
    const checkModuleIntegrity = async () => {
      try {
        const res = await fetch('http://65.20.79.65:4006/module/protected-values');
        const protectedValues = await res.json();
        if (protectedValues.MIN_TRUST_WEIGHT !== MIN_TRUST_WEIGHT) {
          console.warn('Module integrity check failed: MIN_TRUST_WEIGHT mismatch');
          setCanAccessAdmin(false);
          return;
        }
      } catch (e) {
        console.error('Failed to verify module integrity:', e);
        setCanAccessAdmin(false);
        return;
      }
    };
    checkModuleIntegrity();
    const handleSubscriptionToggle = async () => {
      const email = await window.getInput('Enter your email for voting issue announcements:');
      if (!email) return;
      const pin = await window.getPIN('Please enter your PIN to confirm:');
      if (!pin) return;
      const endpoint = subscribed ? '/unsubscribe' : '/subscribe';
    try {
      await fetch(`${BACKEND_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin, genesis: window?.USER?.genesis })
      });
      setSubscribed(!subscribed);
    } catch (e) {
      console.error(`Failed to ${subscribed ? 'unsubscribe' : 'subscribe'}:`, e);
    }
  };

  const checkTrust = async () => {
      try {
        const genesis = window?.USER?.genesis;
        if (!genesis) return;
        const res = await window.API.get(`/finance/get/trust`, { params: { name: `${genesis}:trust` } });
        const trust = parseInt(res?.trust || 0);
        setUserTrust(trust);
        if (trust >= MIN_TRUST_WEIGHT) setCanAccessAdmin(true);
      } catch (e) {
        setCanAccessAdmin(false);
      }
    };
    checkTrust();
  }, [dispatch]);

  return (
    <div>
      <h2>Nexus Community Voting</h2>
      <div>
        <button onClick={handleSubscriptionToggle}>{subscribed ? 'Unsubscribe from Announcements' : 'Subscribe to Announcements'}</button>
      </div>
      {canAccessAdmin && <p><Link to="/admin">Go to Admin Panel</Link></p>}
      {loading ? <p>Loading...</p> : (
        <ul>
          {votes.filter(vote => vote.min_trust === undefined || userTrust >= vote.min_trust).map((vote) => (
            <li key={vote.id}>
              <Link to={`/issue/${vote.id}`}>{vote.title}</Link>
              {vote.created_by === window?.USER?.genesis && (
                <div><Link to={`/admin?edit=${vote.id}`}>(edit)</Link></div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VotingPage;
