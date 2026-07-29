import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff, LocalShipping } from '@mui/icons-material';
import { FirebaseError } from 'firebase/app';
import { doc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from './useAuth';

function authErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password.';
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait and try again.';
      default:
        return 'Sign in failed. Please try again.';
    }
  }
  return 'Sign in failed. Please try again.';
}

export default function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    const target = email.trim();
    if (!target) {
      setInfo(null);
      setError('Enter your email address first, then tap Forgot password.');
      return;
    }
    setError(null);
    setInfo(null);
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, target);
      // Deliberately the same message whether or not the account exists, so
      // this form can't be used to discover which emails are registered.
      setInfo(`If an account exists for ${target}, a reset link is on its way.`);
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'auth/user-not-found') {
        setInfo(`If an account exists for ${target}, a reset link is on its way.`);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const cred = await login(email.trim(), password);

      // Claim first, users/{uid}.role as the migration fallback — same
      // precedence as AuthContext and firestore.rules. Checking only the role
      // doc would reject accounts that hold the claim but no profile doc, even
      // though the backend grants them full access.
      const token = await cred.user.getIdTokenResult();
      let authorized = token.claims.admin === true;

      if (!authorized) {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        authorized = snap.exists() && snap.data().role === 'admin';
      }

      if (!authorized) {
        await logout();
        setError('This account does not have admin access.');
        setSubmitting(false);
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper elevation={0} sx={{ p: 5, width: 420, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, gap: 1 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LocalShipping sx={{ color: 'white', fontSize: 30 }} />
          </Box>
          <Typography variant="h5">Admin Portal</Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to manage your store
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {info && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {info}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            fullWidth
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting || resetting}
            sx={{ mt: 1, height: 46 }}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
          </Button>
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={handleReset}
            disabled={submitting || resetting}
            sx={{ alignSelf: 'center', fontSize: 14 }}
          >
            {resetting ? 'Sending reset link…' : 'Forgot password?'}
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}
