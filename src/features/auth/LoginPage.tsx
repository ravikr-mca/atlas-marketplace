import { useState } from 'react';
import {
  Alert, Box, Button, Card, CardActionArea, CardContent, Chip, Dialog, DialogContent, DialogTitle, Divider,
  List, ListItemButton, ListItemText, Paper, Stack, TextField, Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useSearchParams } from 'react-router-dom';
import { demoLogin, listDemoPersonas, login, ssoLogin, staffAccounts, type DemoPersona } from '../../mock/auth';
import { isApiError } from '../../mock/errors';
import { DEMO_PASSWORD } from '../../mock/seed/credentials';
import { DEMO_MODE, safeNext, useAuthActions } from '../../auth/useAuthActions';
import { useSession } from '../../auth/useSession';
import { ROLE_LABEL } from '../../auth/permissions';
import { AtlasLogo } from '../../components/AtlasLogo';
import { ChartPatternBackground } from '../../components/ChartPatternBackground';
import { color, font } from '../../theme/tokens';

const schema = z.object({
  email: z.email('Enter a valid e-mail address.'),
  password: z.string().min(1, 'Enter your password.'),
});
type Values = z.infer<typeof schema>;

const accreditationChip: Record<string, { label: string; color: 'success' | 'warning' | 'default' }> = {
  VERIFIED: { label: 'Verified', color: 'success' },
  PENDING: { label: 'Pending review', color: 'warning' },
  UNVERIFIED: { label: 'Not accredited', color: 'default' },
};

export function LoginPage() {
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const { status } = useSession();
  const { startSession } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ssoOpen, setSsoOpen] = useState(false);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  if (status === 'authenticated') return <Navigate to={next} replace />;

  const run = async (fn: () => Promise<{ token: string }>) => {
    setBusy(true);
    setError(null);
    try {
      startSession((await fn()).token);
    } catch (e) {
      setError(isApiError(e) ? e.message : 'Something went wrong. Please try again.');
      setSsoOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const personas = DEMO_MODE ? listDemoPersonas() : [];
  const byGroup = (pred: (p: DemoPersona) => boolean) => personas.filter(pred);

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', py: { xs: 3, sm: 6 }, px: 2 }}>
      <ChartPatternBackground />
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 960, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 3 }}>
          <AtlasLogo size={32} />
          <Typography variant="h5" sx={{ fontFamily: font.display, color: 'primary.main' }}>Atlas Marketplace</Typography>
        </Stack>

        {params.get('reason') === 'expired' && (
          <Alert severity="info" sx={{ mb: 2 }}>Your session timed out after 30 idle minutes. Sign in again to continue — you’ll return to where you were.</Alert>
        )}
        {error && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
          <Paper elevation={2} sx={{ p: { xs: 2.5, sm: 3.5 }, width: '100%', maxWidth: { md: 400 }, flexShrink: 0 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Sign in</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Private-markets placement for GCC investors and global fund managers.
            </Typography>
            <Box component="form" noValidate onSubmit={form.handleSubmit((v) => run(() => login(v)))}>
              <Stack spacing={2}>
                <TextField label="Work e-mail" type="email" autoComplete="username" {...form.register('email')}
                  error={!!form.formState.errors.email} helperText={form.formState.errors.email?.message} />
                <TextField label="Password" type="password" autoComplete="current-password" {...form.register('password')}
                  error={!!form.formState.errors.password} helperText={form.formState.errors.password?.message} />
                <Button type="submit" variant="contained" size="large" disabled={busy}>Sign in</Button>
              </Stack>
            </Box>
            <Divider sx={{ my: 2.5 }}>or</Divider>
            <Button fullWidth variant="outlined" size="large" onClick={() => setSsoOpen(true)} disabled={busy}>
              Greenstone staff — sign in with Entra ID
            </Button>
            {DEMO_MODE && (
              <Alert severity="warning" icon={false} sx={{ mt: 2.5, fontSize: 13 }}>
                <strong>DEMO ONLY.</strong> Mock sign-in with no real accounts. Any demo persona’s e-mail works with the shared
                password <code>{DEMO_PASSWORD}</code> — or just click a persona.
              </Alert>
            )}
          </Paper>

          {DEMO_MODE && (
            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>Try it as…</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                One click, no typing. Each persona shows a different part of the permission model.
              </Typography>
              {([
                ['Investors (LPs)', byGroup((p) => p.role === 'LP')],
                ['Fund managers (GPs)', byGroup((p) => p.role === 'GP')],
                ['Greenstone staff (SSO)', byGroup((p) => p.sso)],
              ] as const).map(([title, list]) => (
                <Box key={title} sx={{ mb: 2.5 }}>
                  <Typography variant="overline" color="text.secondary">{title}</Typography>
                  <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, mt: 0.5 }}>
                    {list.map((p) => (
                      <Card key={p.userId} variant="outlined" sx={{ borderTop: `3px solid ${p.role === 'LP' ? color.sky[600] : color.forest[700]}` }}>
                        <CardActionArea disabled={busy} onClick={() => run(() => demoLogin(p.userId))} aria-label={`Sign in as ${p.name}, ${p.title ?? ROLE_LABEL[p.role]} at ${p.organizationName}`}>
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography fontWeight={600} noWrap>{p.name}</Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>{p.organizationName}</Typography>
                              </Box>
                              {!p.sso && <Chip size="small" {...accreditationChip[p.accreditation]} />}
                            </Stack>
                            <Typography variant="body2" sx={{ mt: 1 }}>{p.blurb}</Typography>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      </Box>

      <Dialog open={ssoOpen} onClose={() => setSsoOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Sign in with Entra ID</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Mock Microsoft account chooser — staff identities come from the company directory, so there is no password here.
          </Typography>
          <List>
            {staffAccounts().map((a) => (
              <ListItemButton key={a.userId} onClick={() => run(() => ssoLogin(a.userId))}>
                <ListItemText primary={a.name} secondary={`${a.title} · ${a.email}`} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
