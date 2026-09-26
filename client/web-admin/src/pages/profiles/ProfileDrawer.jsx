import { useEffect, useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import SideDrawer from '../../utils/SideDrawer';
import Skeleton from '../../utils/Skeleton';
import { getEntityProfile } from '../../services/profiles.service';
import { getProfileDefinition } from './profile.registry';

/*
 * The one container that shows any profile in a side drawer. It owns the fetch, the
 * loading and error states, and a small history so a link inside one profile (farm ->
 * branch -> cattle) opens in place with a Back button. Which component renders the data
 * comes from the registry, so this file never changes when a profile type is added.
 *
 * Usage: const drawer = useProfileDrawer();  ...  <ProfileDrawer {...drawer.props} />
 *        drawer.open('cattle', 19)
 */
function ProfileDrawer({ isOpen, target, onClose, onNavigate, onBack, canGoBack }) {

    const [state, setState] = useState({ loading: false, error: null, data: null });
    const requestSeq = useRef(0);   // only the newest request may paint the drawer

    const definition = target ? getProfileDefinition(target.type) : null;

    useEffect(() => {
        if (!isOpen || !target || !definition) return;

        const seq = ++requestSeq.current;
        setState({ loading: true, error: null, data: null });

        (async () => {
            const result = await getEntityProfile(target.type, target.id);
            if (seq !== requestSeq.current) return;

            if (result?.success) {
                setState({ loading: false, error: null, data: result.data.profile });
            } else {
                setState({ loading: false, error: result?.error || result?.message || 'Unable to load the profile.', data: null });
            }
        })();
    }, [isOpen, target?.type, target?.id]);

    const ProfileComponent = definition?.component;
    const title = definition ? `${definition.title} profile` : 'Profile';

    return (
        <SideDrawer isOpen={isOpen} onClose={onClose} title={title} drawerSize={definition?.drawerSize || 'sm'}>

            {canGoBack && (
                <button type="button" onClick={onBack}
                    className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[var(--text-secondary)]
                        transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]">
                    <Icons.ArrowLeft size={16} /> Back
                </button>
            )}

            {!definition && target && (
                <p className="text-sm text-[var(--danger-text)]">'{target.type}' is not a known profile type.</p>
            )}

            {state.loading && (
                <div className="space-y-4">
                    <Skeleton variant="card" count={1} />
                    <Skeleton variant="table" rows={4} columns={3} />
                </div>
            )}

            {!state.loading && state.error && (
                <div className="rounded-2xl border border-dashed border-[var(--danger-border)] bg-[var(--danger-bg)] p-8 text-center text-sm text-[var(--danger-text)]">
                    {state.error}
                </div>
            )}

            {!state.loading && state.data && ProfileComponent && (
                <ProfileComponent profile={state.data} onNavigate={onNavigate} />
            )}

        </SideDrawer>
    );
}

export default ProfileDrawer;
