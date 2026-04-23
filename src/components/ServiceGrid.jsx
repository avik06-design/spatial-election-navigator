import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRightLeft, Fingerprint, Search } from 'lucide-react';

/**
 * @typedef {Object} ServiceItem
 * @property {string} id - Unique identifier for the service (e.g., 'registration').
 * @property {string} title - Display title of the ECI service.
 * @property {string} description - Brief description of the service purpose and associated form.
 * @property {string} form - Official ECI form identifier (e.g., 'Form 6', 'Form 8').
 * @property {import('lucide-react').LucideIcon} icon - Lucide React icon component reference.
 */

/**
 * @typedef {Object} ServiceGridProps
 * @property {(serviceId: string) => void} onServiceClick - Callback invoked with the service ID when a card is activated.
 */

/**
 * Static array of ECI voter services with associated form metadata and icons.
 * Frozen at module level for referential stability across renders.
 * @type {Readonly<ServiceItem[]>}
 */
const SERVICES = [
  {
    id: 'registration',
    title: 'New Voter Registration',
    description: 'First-time voters can register using Form 6 to get their Electoral Photo ID Card (EPIC).',
    form: 'Form 6',
    icon: UserPlus,
  },
  {
    id: 'correction',
    title: 'Shift / Correction of Entries',
    description: 'Update your address, correct name errors, or transfer your registration using Form 8.',
    form: 'Form 8',
    icon: ArrowRightLeft,
  },
  {
    id: 'aadhaar',
    title: 'Aadhaar Linking',
    description: 'Link your Aadhaar number to your Voter ID for identity verification via Form 6B.',
    form: 'Form 6B',
    icon: Fingerprint,
  },
  {
    id: 'tracker',
    title: 'Track Application Status',
    description: 'Check real-time status of your submitted forms using your reference ID.',
    form: 'Tracker',
    icon: Search,
  },
];

/**
 * Animation variants for staggered card entrance.
 * Each card fades in and slides up with a spring-based transition.
 * @constant {import('framer-motion').Variants}
 */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

/** @constant {import('framer-motion').Variants} */
const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', damping: 25, stiffness: 120 },
  },
};

/**
 * ServiceGrid renders a responsive grid of glassmorphic ECI service cards.
 * Memoized with React.memo to prevent unnecessary re-renders when parent state
 * (e.g., chat input) changes without affecting the grid.
 *
 * @param {Object} props
 * @param {(serviceId: string) => void} props.onServiceClick - Callback fired when a service card is activated.
 * @returns {JSX.Element} A 2x2 responsive grid of animated service cards.
 */
const ServiceGrid = React.memo(function ServiceGrid({ onServiceClick }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl mx-auto"
      role="list"
      aria-label="ECI voter services"
    >
      {SERVICES.map((service) => {
        const Icon = service.icon;
        return (
          <motion.button
            key={service.id}
            variants={cardVariants}
            whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onServiceClick(service.id)}
            role="listitem"
            aria-label={`${service.title} — ${service.form}`}
            className="group relative text-left bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:bg-white/[0.04] hover:border-white/20 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
          >
            {/* Icon */}
            <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 group-hover:bg-white/10 transition-colors duration-500">
              <Icon
                size={22}
                className="text-white/60 group-hover:text-white transition-colors duration-500"
                aria-hidden="true"
              />
            </div>

            {/* Content */}
            <h3 className="text-white text-lg font-semibold tracking-tight mb-2">
              {service.title}
            </h3>
            <p className="text-white/40 text-sm leading-relaxed">
              {service.description}
            </p>

            {/* Form Badge */}
            <span className="mt-5 inline-block text-xs font-medium tracking-wider uppercase text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1">
              {service.form}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
});

export default ServiceGrid;
