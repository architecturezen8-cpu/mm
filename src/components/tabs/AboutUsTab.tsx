'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import ScrollReveal from '@/components/ScrollReveal';
import EditableSection from '@/components/admin/EditableSection';
import EditableField from '@/components/admin/EditableField';
import { useSectionContent, getContentString, getContentArray, getContentNumber } from '@/lib/useSectionContent';
import {
  Radio, Camera, Video, Volume2, Megaphone, Share2,
  Instagram, Facebook, Youtube, MapPin, ExternalLink,
  Trophy, Users, Sparkles, ChevronDown
} from 'lucide-react';

/* ── Count-Up Animation Hook ── */
function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [hasStarted, target, duration]);

  return { count, ref };
}

/* ── Default Content ── */
const DEFAULT_HERO_CONTENT = {
  heading: "Thomians' Media",
  tagline: "Sri Lanka's Premier School Media Network",
  logo_image: '/logos/thomians-media-round-logo.jpg',
};

const DEFAULT_WHO_WE_ARE_CONTENT = {
  heading: 'Who We Are',
  description: "We provide seamless media coverage to all the events that happen in our school, we developed a team back in January 2014 which consists students of all kinds of professional abilities such as photography, video editing and computer management. Our responsibility is to preserve the most valuable memories that happen in our school. Please check the website to find out archives of photos and videos. Thank You! Enjoy!",
  established: 'Est. 2014',
};

const DEFAULT_WHAT_WE_DO_CONTENT = {
  heading: 'What We Do',
  services: [
    { title: 'Live Streaming', description: 'Real-time coverage of school events and matches', icon: 'radio' },
    { title: 'Photography', description: 'Capturing every moment with professional precision', icon: 'camera' },
    { title: 'Videography', description: 'Cinematic video production for all events', icon: 'video' },
    { title: 'Sound Management', description: 'Crystal clear audio for every occasion', icon: 'volume' },
    { title: 'Announcing', description: 'Professional commentary and event hosting', icon: 'megaphone' },
    { title: 'Social Media Coverage', description: 'Engaging content across all platforms', icon: 'share' },
  ],
};

const DEFAULT_TEAM_CONTENT = {
  heading: 'Our Team',
  members: [
    { name: 'Isuru Arambepola', role: 'President', photo: '' },
    { name: 'Imesh Liyanage', role: 'Vice President', photo: '' },
    { name: 'Sathila Wijayathilake', role: 'Secretary', photo: '' },
    { name: 'Dimantha Malwenna', role: 'Treasurer', photo: '' },
    { name: 'Sasika Randunuge', role: 'Lead Web Developer', photo: '' },
    { name: 'Thehan Batagalla', role: 'Senior Web Developer', photo: '' },
  ],
};

const DEFAULT_STATS_CONTENT = {
  stat1_value: 5000,
  stat1_label: 'Photos Captured',
  stat2_value: 10000,
  stat2_label: 'Social Reach',
};

const DEFAULT_SOCIAL_CONTENT = {
  heading: 'Follow Us',
  instagram: 'https://instagram.com/thomiansmedia',
  facebook: 'https://facebook.com/thomiansmedia',
  youtube: 'https://youtube.com/@thomiansmedia',
};

const DEFAULT_CREDITS_CONTENT = {
  credit_text: 'Web and Score System',
  credit_name: 'Sasika Randunuge',
};

const DEFAULT_LOCATION_CONTENT = {
  heading: 'Our Location',
  address: "St. Thomas' College, Matale, Sri Lanka",
  coordinates: '7.4702° N, 80.6219° E',
  map_image: '',
  map_link: 'https://maps.google.com/?q=7.4702,80.6219',
};

/* ── Icon Mapper ── */
function ServiceIcon({ icon, className }: { icon: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    radio: <Radio className={className} />,
    camera: <Camera className={className} />,
    video: <Video className={className} />,
    volume: <Volume2 className={className} />,
    megaphone: <Megaphone className={className} />,
    share: <Share2 className={className} />,
  };
  return <>{icons[icon] || <Sparkles className={className} />}</>;
}

/* ── Stagger container variants ── */
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ── Main Component ── */
export default function AboutUsTab() {
  const heroContent = useSectionContent('about-hero', DEFAULT_HERO_CONTENT);
  const whoWeAreContent = useSectionContent('about-whoweare', DEFAULT_WHO_WE_ARE_CONTENT);
  const whatWeDoContent = useSectionContent('about-whatwedo', DEFAULT_WHAT_WE_DO_CONTENT);
  const teamContent = useSectionContent('about-team', DEFAULT_TEAM_CONTENT);
  const statsContent = useSectionContent('about-stats', DEFAULT_STATS_CONTENT);
  const socialContent = useSectionContent('about-social', DEFAULT_SOCIAL_CONTENT);
  const creditsContent = useSectionContent('about-credits', DEFAULT_CREDITS_CONTENT);
  const locationContent = useSectionContent('about-location', DEFAULT_LOCATION_CONTENT);

  const heroHeading = getContentString(heroContent, 'heading', "Thomians' Media");
  const heroTagline = getContentString(heroContent, 'tagline', "Sri Lanka's Premier School Media Network");
  const heroLogo = getContentString(heroContent, 'logo_image', '/logos/thomians-media-round-logo.jpg');

  const wwaHeading = getContentString(whoWeAreContent, 'heading', 'Who We Are');
  const wwaDescription = getContentString(whoWeAreContent, 'description', DEFAULT_WHO_WE_ARE_CONTENT.description);
  const wwaEstablished = getContentString(whoWeAreContent, 'established', 'Est. 2014');

  const wwdHeading = getContentString(whatWeDoContent, 'heading', 'What We Do');
  const services = getContentArray<Record<string, unknown>>(whatWeDoContent, 'services', DEFAULT_WHAT_WE_DO_CONTENT.services as unknown as Record<string, unknown>[]);

  const teamHeading = getContentString(teamContent, 'heading', 'Our Team');
  const members = getContentArray<Record<string, string>>(teamContent, 'members', DEFAULT_TEAM_CONTENT.members as unknown as Record<string, string>[]);

  const stat1Value = getContentNumber(statsContent, 'stat1_value', 5000);
  const stat1Label = getContentString(statsContent, 'stat1_label', 'Photos Captured');
  const stat2Value = getContentNumber(statsContent, 'stat2_value', 10000);
  const stat2Label = getContentString(statsContent, 'stat2_label', 'Social Reach');

  const socialHeading = getContentString(socialContent, 'heading', 'Follow Us');
  const instagramUrl = getContentString(socialContent, 'instagram', 'https://instagram.com/thomiansmedia');
  const facebookUrl = getContentString(socialContent, 'facebook', 'https://facebook.com/thomiansmedia');
  const youtubeUrl = getContentString(socialContent, 'youtube', 'https://youtube.com/@thomiansmedia');

  const creditText = getContentString(creditsContent, 'credit_text', 'Web and Score System');
  const creditName = getContentString(creditsContent, 'credit_name', 'Sasika Randunuge');

  const locationHeading = getContentString(locationContent, 'heading', 'Our Location');
  const locationAddress = getContentString(locationContent, 'address', "St. Thomas' College, Matale, Sri Lanka");
  const locationCoordinates = getContentString(locationContent, 'coordinates', '7.4702° N, 80.6219° E');
  const locationMapImage = getContentString(locationContent, 'map_image', '');
  const locationMapLink = getContentString(locationContent, 'map_link', 'https://maps.google.com/?q=7.4702,80.6219');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 sm:space-y-8"
    >
      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="about-hero" pageId="about" type="hero" title="About Hero" content={heroContent}>
        <div className="relative min-h-[50vh] sm:min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 sm:py-20 overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-gold/[0.03] rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-lux-bg to-transparent" />
            {/* Floating particles */}
            <div className="aurora-particle aurora-particle-1" />
            <div className="aurora-particle aurora-particle-2" />
            <div className="aurora-particle aurora-particle-3" />
          </div>

          <div className="relative z-10 max-w-xl mx-auto">
            {/* Logo with aurora ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                {/* Aurora rotating ring — outer */}
                <div className="aurora-ring aurora-ring-outer" />
                {/* Aurora rotating ring — inner */}
                <div className="aurora-ring aurora-ring-inner" />
                {/* Subtle glow pulse */}
                <div className="absolute inset-0 -m-4 rounded-full bg-gold/5" style={{ animation: 'aurora-glow-pulse 4s ease-in-out infinite' }} />
                <EditableField sectionId="about-hero" pageId="about" type="hero" title="About Hero" sectionContent={heroContent} fieldKey="logo_image" fieldType="image">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 relative z-10">
                    <Image src={heroLogo} alt="Thomians' Media" fill sizes="(max-width: 640px) 96px, 128px" className="object-contain" priority />
                  </div>
                </EditableField>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <EditableField sectionId="about-hero" pageId="about" type="hero" title="About Hero" sectionContent={heroContent} fieldKey="heading" fieldType="text">
                <h1
                  className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[4px] sm:tracking-[8px] uppercase mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #FFC300, #FFD54F, #FFC300)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {heroHeading}
                </h1>
              </EditableField>
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <EditableField sectionId="about-hero" pageId="about" type="hero" title="About Hero" sectionContent={heroContent} fieldKey="tagline" fieldType="text">
                <p className="text-sm sm:text-base text-text-secondary tracking-[3px] sm:tracking-[4px] uppercase">
                  {heroTagline}
                </p>
              </EditableField>
            </motion.div>

            {/* Decorative divider */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="h-px mx-auto mt-8"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.3), transparent)' }}
            />
          </div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-5 h-5 text-gold/30" style={{ animation: 'scroll-hint-bounce 2s ease-in-out infinite' }} />
          </motion.div>
        </div>
      </EditableSection>

      {/* ═══════════════════════════════════════════
          WHO WE ARE
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="about-whoweare" pageId="about" type="text" title="Who We Are" content={whoWeAreContent}>
        <ScrollReveal animation="fade-up">
          <div className="lux-card group">
            {/* Top accent line */}
            <div className="h-px w-0 group-hover:w-full transition-all duration-700" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,195,0,0.4), transparent)' }} />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 border border-gold/20 bg-gold/5">
                <Users className="w-4 h-4 text-gold" />
              </div>
              <EditableField sectionId="about-whoweare" pageId="about" type="text" title="Who We Are" sectionContent={whoWeAreContent} fieldKey="heading" fieldType="text">
                <h2 className="card-title mb-0">{wwaHeading}</h2>
              </EditableField>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <EditableField sectionId="about-whoweare" pageId="about" type="text" title="Who We Are" sectionContent={whoWeAreContent} fieldKey="description" fieldType="text">
                  <p className="text-text-secondary text-sm sm:text-base leading-relaxed tracking-wide">
                    {wwaDescription}
                  </p>
                </EditableField>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="text-center px-6 py-4 border border-gold/20 bg-gold-ghost/10 relative overflow-hidden">
                  {/* Subtle shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent" style={{ animation: 'shimmer-slide 3s ease-in-out infinite', backgroundSize: '200% 100%' }} />
                  <EditableField sectionId="about-whoweare" pageId="about" type="text" title="Who We Are" sectionContent={whoWeAreContent} fieldKey="established" fieldType="text">
                    <p
                      className="text-2xl sm:text-3xl font-black tracking-[3px] relative z-10"
                      style={{
                        background: 'linear-gradient(135deg, #FFC300, #FFD54F)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {wwaEstablished}
                    </p>
                  </EditableField>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* ═══════════════════════════════════════════
          WHAT WE DO
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="about-whatwedo" pageId="about" type="text" title="What We Do" content={whatWeDoContent}>
        <ScrollReveal animation="fade-up">
          <div className="lux-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 border border-gold/20 bg-gold/5">
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <EditableField sectionId="about-whatwedo" pageId="about" type="text" title="What We Do" sectionContent={whatWeDoContent} fieldKey="heading" fieldType="text">
                <h2 className="card-title mb-0">{wwdHeading}</h2>
              </EditableField>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {services.map((service, i) => (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="group relative border border-lux-border p-5 text-center hover:border-gold/30 transition-all duration-500 overflow-hidden"
                >
                  {/* Hover glow sweep */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] via-transparent to-gold/[0.02]" />
                  </div>
                  {/* Bottom accent line on hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gold/30 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  <div className="relative z-10">
                    <span className="text-gold mb-3 flex justify-center group-hover:scale-110 transition-transform duration-300">
                      <ServiceIcon icon={(service.icon as string) || 'sparkles'} className="w-7 h-7" />
                    </span>
                    <p className="text-xs sm:text-sm font-semibold uppercase tracking-[2px] text-text-primary mb-2">
                      {service.title as string}
                    </p>
                    <p className="text-[10px] sm:text-xs text-text-muted leading-relaxed">
                      {service.description as string}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* ═══════════════════════════════════════════
          OUR TEAM
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="about-team" pageId="about" type="text" title="Our Team" content={teamContent}>
        <ScrollReveal animation="fade-up">
          <div className="lux-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 border border-gold/20 bg-gold/5">
                <Trophy className="w-4 h-4 text-gold" />
              </div>
              <EditableField sectionId="about-team" pageId="about" type="text" title="Our Team" sectionContent={teamContent} fieldKey="heading" fieldType="text">
                <h2 className="card-title mb-0">{teamHeading}</h2>
              </EditableField>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
            >
              {members.map((member, i) => (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="group relative border border-lux-border hover:border-gold/30 transition-colors duration-300 overflow-hidden"
                >
                  {/* Portrait card with image */}
                  <div className="relative w-full aspect-[3/4] bg-lux-surface overflow-hidden">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name as string}
                        className="w-full h-full object-cover object-top min-h-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-lux-surface to-lux-bg">
                        <span className="text-2xl sm:text-3xl font-black text-gold/20">
                          {(member.name as string).split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                    {/* Bottom gradient overlay for text */}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                    {/* Role badge at top */}
                    <div className="absolute top-1.5 left-1.5 right-1.5">
                      <span className="text-[6px] sm:text-[7px] uppercase tracking-[1px] sm:tracking-[1.5px] font-bold text-gold/80 bg-black/50 px-1.5 py-0.5 backdrop-blur-sm block truncate">
                        {member.role as string}
                      </span>
                    </div>
                  </div>
                  {/* Name bar */}
                  <div className="px-2 py-2 border-t border-lux-border">
                    <p className="text-[8px] sm:text-[10px] font-bold text-text-primary tracking-[0.5px] sm:tracking-[1px] uppercase leading-tight">
                      {member.name as string}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* ═══════════════════════════════════════════
          STATS / NUMBERS
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="about-stats" pageId="about" type="stats" title="Stats" content={statsContent}>
        <ScrollReveal animation="scale">
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <CountUpStat value={stat1Value} label={stat1Label} suffix="+" />
            <CountUpStat value={stat2Value} label={stat2Label} suffix="+" />
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* ═══════════════════════════════════════════
          SOCIAL MEDIA — with aurora border animations
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="about-social" pageId="about" type="text" title="Social Media" content={socialContent}>
        <ScrollReveal animation="fade-up">
          <div className="lux-card text-center">
            <EditableField sectionId="about-social" pageId="about" type="text" title="Social Media" sectionContent={socialContent} fieldKey="heading" fieldType="text">
              <h2 className="card-title mb-8">{socialHeading}</h2>
            </EditableField>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-30px' }}
              className="flex items-center justify-center gap-5 sm:gap-8"
            >
              <motion.div variants={staggerItem}>
                <SocialLink href={instagramUrl} icon={<Instagram className="w-6 h-6" />} label="Instagram" color="#E4405F" />
              </motion.div>
              <motion.div variants={staggerItem}>
                <SocialLink href={facebookUrl} icon={<Facebook className="w-6 h-6" />} label="Facebook" color="#1877F2" />
              </motion.div>
              <motion.div variants={staggerItem}>
                <SocialLink href={youtubeUrl} icon={<Youtube className="w-6 h-6" />} label="YouTube" color="#FF0000" />
              </motion.div>
            </motion.div>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* ═══════════════════════════════════════════
          CREDITS — Web & Score System by Sasika Randunuge
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="about-credits" pageId="about" type="text" title="Credits" content={creditsContent}>
        <ScrollReveal animation="fade-up">
          <div className="text-center py-6">
            <div className="inline-block relative">
              {/* Decorative line above */}
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '12rem' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-px mx-auto mb-4"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.3), transparent)' }}
              />

              <EditableField sectionId="about-credits" pageId="about" type="text" title="Credits" sectionContent={creditsContent} fieldKey="credit_text" fieldType="text">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[3px] sm:tracking-[4px] text-text-muted mb-2">
                  {creditText}
                </p>
              </EditableField>

              <EditableField sectionId="about-credits" pageId="about" type="text" title="Credits" sectionContent={creditsContent} fieldKey="credit_name" fieldType="text">
                <p
                  className="text-sm sm:text-lg font-black tracking-[2px] sm:tracking-[3px] uppercase"
                  style={{
                    background: 'linear-gradient(135deg, #FFC300, #FFD54F, #FFC300)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 10px rgba(255, 195, 0, 0.2))',
                  }}
                >
                  {creditName}
                </p>
              </EditableField>

              {/* Decorative line below */}
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '12rem' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-px mx-auto mt-4"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 195, 0, 0.3), transparent)' }}
              />
            </div>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* ═══════════════════════════════════════════
          LOCATION — Simple image with click link
          ═══════════════════════════════════════════ */}
      <EditableSection sectionId="about-location" pageId="about" type="text" title="Location" content={locationContent}>
        <ScrollReveal animation="fade-up">
          <div className="lux-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 border border-gold/20 bg-gold/5">
                <MapPin className="w-4 h-4 text-gold" />
              </div>
              <EditableField sectionId="about-location" pageId="about" type="text" title="Location" sectionContent={locationContent} fieldKey="heading" fieldType="text">
                <h2 className="card-title mb-0">{locationHeading}</h2>
              </EditableField>
            </div>

            {/* Map — editable image with click link */}
            <EditableField sectionId="about-location" pageId="about" type="text" title="Location" sectionContent={locationContent} fieldKey="map_image" fieldType="image">
              <LocationMap mapImage={locationMapImage} mapLink={locationMapLink} address={locationAddress} coordinates={locationCoordinates} />
            </EditableField>

            {/* Location details */}
            <div className="mt-4 text-center space-y-1">
              <EditableField sectionId="about-location" pageId="about" type="text" title="Location" sectionContent={locationContent} fieldKey="address" fieldType="text">
                <p className="text-xs sm:text-sm text-text-primary tracking-[1px] font-medium">{locationAddress}</p>
              </EditableField>
              <EditableField sectionId="about-location" pageId="about" type="text" title="Location" sectionContent={locationContent} fieldKey="coordinates" fieldType="text">
                <p className="text-[9px] sm:text-[10px] text-text-muted tracking-[2px] uppercase">{locationCoordinates}</p>
              </EditableField>
            </div>
          </div>
        </ScrollReveal>
      </EditableSection>

      {/* ═══════════════════════════════════════════
          CSS Animations — Aurora Ring + Professional Effects
          ═══════════════════════════════════════════ */}
      <style>{`
        /* ── Aurora Ring — Rotating Conic Gradient Border ── */
        @property --aurora-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes aurora-rotate {
          0% { --aurora-angle: 0deg; }
          100% { --aurora-angle: 360deg; }
        }

        .aurora-ring {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .aurora-ring-outer {
          inset: -12px;
          background: conic-gradient(
            from var(--aurora-angle),
            transparent 0%,
            rgba(255, 195, 0, 0.4) 10%,
            transparent 20%,
            rgba(255, 213, 79, 0.25) 35%,
            transparent 45%,
            rgba(255, 195, 0, 0.35) 60%,
            transparent 70%,
            rgba(255, 213, 79, 0.2) 85%,
            transparent 100%
          );
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
          animation: aurora-rotate 6s linear infinite;
        }

        .aurora-ring-inner {
          inset: -6px;
          background: conic-gradient(
            from var(--aurora-angle),
            transparent 0%,
            rgba(255, 195, 0, 0.3) 15%,
            transparent 30%,
            rgba(255, 213, 79, 0.15) 50%,
            transparent 65%,
            rgba(255, 195, 0, 0.25) 80%,
            transparent 100%
          );
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 1px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 1px));
          animation: aurora-rotate 8s linear infinite reverse;
        }

        /* ── Aurora Ring for Social Media Icons ── */
        .aurora-ring-social {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .aurora-ring-social-outer {
          inset: -4px;
          background: conic-gradient(
            from var(--aurora-angle),
            transparent 0%,
            rgba(255, 195, 0, 0.5) 8%,
            transparent 18%,
            rgba(255, 213, 79, 0.3) 30%,
            transparent 45%,
            rgba(255, 195, 0, 0.4) 55%,
            transparent 68%,
            rgba(255, 213, 79, 0.25) 82%,
            transparent 100%
          );
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
          animation: aurora-rotate 4s linear infinite;
        }

        .aurora-ring-social-inner {
          inset: -2px;
          background: conic-gradient(
            from var(--aurora-angle),
            transparent 0%,
            rgba(255, 195, 0, 0.35) 12%,
            transparent 28%,
            rgba(255, 213, 79, 0.2) 48%,
            transparent 62%,
            rgba(255, 195, 0, 0.3) 78%,
            transparent 100%
          );
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 1px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 1px));
          animation: aurora-rotate 5s linear infinite reverse;
        }

        /* ── Aurora Ring for Team Avatars ── */
        .aurora-ring-avatar {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          pointer-events: none;
          background: conic-gradient(
            from var(--aurora-angle),
            transparent 0%,
            rgba(255, 195, 0, 0.3) 10%,
            transparent 25%,
            rgba(255, 213, 79, 0.2) 45%,
            transparent 60%,
            rgba(255, 195, 0, 0.25) 80%,
            transparent 100%
          );
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px));
          animation: aurora-rotate 6s linear infinite;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .group:hover .aurora-ring-avatar {
          opacity: 1;
        }

        /* ── Floating Particles ── */
        .aurora-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(255, 195, 0, 0.3);
          border-radius: 50%;
          pointer-events: none;
        }

        .aurora-particle-1 {
          top: 20%;
          left: 15%;
          animation: particle-float 8s ease-in-out infinite;
        }

        .aurora-particle-2 {
          top: 60%;
          right: 20%;
          animation: particle-float 6s ease-in-out infinite 2s;
        }

        .aurora-particle-3 {
          bottom: 30%;
          left: 70%;
          animation: particle-float 10s ease-in-out infinite 4s;
        }

        @keyframes particle-float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.5; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.3; }
          75% { transform: translateY(-25px) translateX(8px); opacity: 0.4; }
        }

        /* ── Glow Pulse ── */
        @keyframes aurora-glow-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        /* ── Shimmer Slide ── */
        @keyframes shimmer-slide {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* ── Scroll Hint ── */
        @keyframes scroll-hint-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(6px); opacity: 0.6; }
        }

        /* ── Map Placeholder Pulse ── */
        @keyframes map-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.15; }
        }

        /* ── Map image hover ── */
        .map-image-container img {
          transition: transform 0.5s ease, opacity 0.3s ease;
        }
        .map-image-container:hover img {
          transform: scale(1.02);
          opacity: 0.95;
        }
      `}</style>
    </motion.div>
  );
}

/* ── Count-Up Stat ── */
function CountUpStat({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { count, ref } = useCountUp(value, 2200);
  return (
    <div ref={ref} className="lux-card text-center py-6 relative overflow-hidden group">
      {/* Subtle background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.02] via-transparent to-gold/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <span
          className="text-xl sm:text-3xl font-bold block"
          style={{
            background: 'linear-gradient(135deg, #FFC300, #FFD54F, #FFC300)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {count.toLocaleString()}{suffix}
        </span>
        <span className="text-[9px] sm:text-[10px] uppercase tracking-[3px] text-text-muted mt-2 block">
          {label}
        </span>
      </div>
    </div>
  );
}

/* ── Social Link — with Aurora Ring Border ── */
function SocialLink({ href, icon, label, color }: { href: string; icon: React.ReactNode; label: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-3 px-5 sm:px-7 py-4 border border-lux-border hover:border-gold/30 transition-all duration-500 relative overflow-hidden"
    >
      {/* Aurora ring around icon */}
      <div className="relative">
        <div className="aurora-ring-social aurora-ring-social-outer" />
        <div className="aurora-ring-social aurora-ring-social-inner" />
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-lux-surface border border-lux-border group-hover:border-gold/40 flex items-center justify-center relative z-10 transition-all duration-500">
          <span
            className="text-text-muted group-hover:text-gold transition-colors duration-300"
          >
            {icon}
          </span>
        </div>
      </div>
      <span className="text-[8px] sm:text-[9px] uppercase tracking-[2px] text-text-muted group-hover:text-gold transition-colors duration-300">
        {label}
      </span>
      <ExternalLink className="w-3 h-3 text-text-muted/30 group-hover:text-gold/50 transition-all duration-300 group-hover:translate-y-0.5" />
    </a>
  );
}

/* ── Location Map — Simple image with placeholder and click link ── */
function LocationMap({ mapImage, mapLink, address, coordinates }: {
  mapImage: string;
  mapLink: string;
  address: string;
  coordinates: string;
}) {
  const hasImage = mapImage && mapImage.trim() !== '';

  const mapContent = (
    <div className="relative overflow-hidden" style={{ background: '#0a0808' }}>
      {hasImage ? (
        <div className="map-image-container relative">
          <img
            src={mapImage}
            alt={address || 'Location Map'}
            className="w-full block"
            style={{ opacity: 0.85 }}
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

          {/* Click hint */}
          {mapLink && (
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 pointer-events-none">
              <span className="text-[5px] sm:text-[7px] uppercase tracking-[0.5px] sm:tracking-[1.5px] text-gold/40 bg-black/30 px-1 py-px sm:px-1.5 sm:py-0.5 backdrop-blur-sm">
                Maps →
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Placeholder when no image is set */
        <div className="w-full aspect-[16/9] flex flex-col items-center justify-center gap-3 relative" style={{ background: 'linear-gradient(135deg, #0a0808 0%, #0d0d08 50%, #0a0a0f 100%)' }}>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,195,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,195,0,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          <div className="relative">
            <MapPin className="w-10 h-10 text-gold/30 relative z-10" />
            <div className="absolute inset-0 -m-3 rounded-full border border-gold/15" style={{ animation: 'map-pulse 3s ease-in-out infinite' }} />
          </div>
          <p className="text-text-muted text-xs uppercase tracking-[3px] relative z-10">Map Image Not Set</p>
          <p className="text-text-muted/50 text-[9px] tracking-[1px] relative z-10">Set &quot;Map Image&quot; in admin to display the location map</p>
          {mapLink && (
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-[9px] uppercase tracking-[2px] text-gold/60 hover:text-gold transition-colors border border-gold/20 hover:border-gold/40 px-3 py-1.5 relative z-10"
            >
              Open in Maps →
            </a>
          )}
        </div>
      )}
    </div>
  );

  // Wrap with link if map_link is set
  if (mapLink && hasImage) {
    return (
      <a href={mapLink} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
        {mapContent}
      </a>
    );
  }

  return mapContent;
}
