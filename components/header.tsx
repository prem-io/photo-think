'use client';

import { motion } from 'framer-motion';
import { useSession } from '@/hooks/use-session';

export function Header() {
	const { isAuthenticated, logout } = useSession();

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className='border-b border-border/10 bg-background'>
			<div className='max-w-7xl mx-auto px-6 sm:px-8 py-3 flex items-center justify-between'>
				{/* Left: PhotoThink Logo */}
				<div className='flex items-center gap-2.5'>
					<div className='w-7 h-7 rounded-lg bg-foreground flex items-center justify-center'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='16'
							height='16'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
							className='text-background'>
							<path d='M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z' />
							<circle cx='12' cy='13' r='3.5' />
						</svg>
					</div>
					<h1 className='text-base font-normal text-foreground'>PhotoThink</h1>
				</div>

				{/* Right: User section */}
				<div className='flex items-center gap-3'>
					{isAuthenticated && (
						<motion.button
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							onClick={logout}
							className='text-sm font-light text-muted-foreground hover:text-foreground transition-colors'>
							Logout
						</motion.button>
					)}
				</div>
			</div>
		</motion.div>
	);
}
