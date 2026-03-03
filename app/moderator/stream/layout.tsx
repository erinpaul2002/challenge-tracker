'use client';

import { ReactNode, useEffect, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function StreamRedirectLogic() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const challengesPath = pathname.startsWith('/moderator/stream')
            ? pathname.replace('/moderator/stream', '/moderator/challenges')
            : '/moderator/challenges';
        const queryString = searchParams.toString();
        const target = queryString ? `${challengesPath}?${queryString}` : challengesPath;
        router.replace(target);
    }, [pathname, router, searchParams]);

    return null;
}

export default function StreamModeLayout({ children }: { children: ReactNode }) {
    void children;
    return (
        <Suspense fallback={null}>
            <StreamRedirectLogic />
        </Suspense>
    );
}
