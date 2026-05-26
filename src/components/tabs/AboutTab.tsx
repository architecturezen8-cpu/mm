'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import PremiumIcon from '@/components/PremiumIcon';
import EditableSection from '@/components/admin/EditableSection';
import { MatchInfo } from '@/lib/types';
import { useSectionContent, getContentString, getContentArray } from '@/lib/useSectionContent';
import DynamicSections from '@/components/admin/DynamicSections';

interface AboutTabProps {
  matchInfo: MatchInfo;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Default content for each section
const DEFAULT_HISTORY_CONTENT = {
  heading: 'Match History',
  text: `The Battle of the Golds is one of the most celebrated school cricket rivalries in the central province of Sri Lanka, dating back over a century. Played between St.Thomas' College Matale and Govt.Science College Matale, this fixture has produced some of the most memorable moments in school cricket. The 111th encounter continues this proud tradition of fierce yet respectful competition between the two institutions.\n\nEach year, thousands of old boys, students, and cricket enthusiasts from Matale and beyond gather at the St.Thomas' College Grounds to witness this legendary encounter. The tradition embodies sportsmanship, rivalry, and the enduring spirit of Thomian and Science cricket.`,
};

const DEFAULT_STC_CONTENT = {
  heading: "St.Thomas' College Matale",
  stc_logo: '/logos/st-thomas-college-matale.jpg',
  location: 'Matale, Sri Lanka',
  home_ground: "St.Thomas' College Grounds, Matale",
  team_name: 'Thomians',
  team_color: 'Gold & Black',
};

const DEFAULT_GSC_CONTENT = {
  heading: 'Govt.Science College Matale',
  gsc_logo: '/logos/govt-science-college-matale.jpg',
  location: 'Matale, Sri Lanka',
  home_ground: 'Science College Grounds, Matale',
  team_name: 'Science',
  team_color: 'Red & White',
};

const DEFAULT_RECORDS_CONTENT = {
  heading: 'Records',
  records_items: [
    { label: 'Highest Score', team1: '345/6', team2: '312/4', detail: 'STC — 345/6 (50 ov)' },
    { label: 'Lowest Score', team1: '112', team2: '89', detail: 'GSC — 89 (23.4 ov)' },
    { label: 'Biggest Win', team1: 'By 10 Wkts', team2: 'By 8 Wkts', detail: 'STC won by 10 wkts' },
    { label: 'Most Runs', team1: 'D. Perera (2,450)', team2: 'Y. Rodrigo (1,890)', detail: 'Overall career runs' },
    { label: 'Most Wickets', team1: 'D. Wijeratne (78)', team2: 'A. Bandara (65)', detail: 'Overall career wickets' },
    { label: 'Highest Partnership', team1: '215', team2: '189', detail: 'STC — Perera & Silva' },
  ],
};

const DEFAULT_MEDIA_CONTENT = {
  heading: "About Thomians' Media",
  text: `Thomians' Media is the official digital coverage platform for the Battle of the Golds. Our team of dedicated journalists, analysts, and cricket enthusiasts bring you live updates, in-depth analysis, and comprehensive coverage of every moment that matters.`,
  stat1_value: '50+',
  stat1_label: 'Team Members',
  stat2_value: '111',
  stat2_label: 'Matches Covered',
  stat3_value: '1M+',
  stat3_label: 'Viewers Reached',
};

const DEFAULT_CONTACT_CONTENT = {
  heading: 'Contact Us',
  email: 'media@thomians.lk',
  social: '@thomiansmedia',
  website: 'www.thomiansmedia.lk',
  press_email: 'press@thomians.lk',
};

export default function AboutTab({ matchInfo }: AboutTabProps) {
  const historyContent = useSectionContent('about-history', DEFAULT_HISTORY_CONTENT);
  const stcContent = useSectionContent('about-stc', DEFAULT_STC_CONTENT);
  const gscContent = useSectionContent('about-gsc', DEFAULT_GSC_CONTENT);
  const recordsContent = useSectionContent('about-records', DEFAULT_RECORDS_CONTENT);
  const mediaContent = useSectionContent('about-media', DEFAULT_MEDIA_CONTENT);
  const contactContent = useSectionContent('about-contact', DEFAULT_CONTACT_CONTENT);

  // History
  const historyText = getContentString(historyContent, 'text', DEFAULT_HISTORY_CONTENT.text);
  const historyParagraphs = historyText.split('\n\n');

  // STC
  const stcLogo = getContentString(stcContent, 'stc_logo', DEFAULT_STC_CONTENT.stc_logo);
  const stcLocation = getContentString(stcContent, 'location', DEFAULT_STC_CONTENT.location);
  const stcHomeGround = getContentString(stcContent, 'home_ground', DEFAULT_STC_CONTENT.home_ground);
  const stcTeamName = getContentString(stcContent, 'team_name', DEFAULT_STC_CONTENT.team_name);
  const stcTeamColor = getContentString(stcContent, 'team_color', DEFAULT_STC_CONTENT.team_color);

  // GSC
  const gscLogo = getContentString(gscContent, 'gsc_logo', DEFAULT_GSC_CONTENT.gsc_logo);
  const gscLocation = getContentString(gscContent, 'location', DEFAULT_GSC_CONTENT.location);
  const gscHomeGround = getContentString(gscContent, 'home_ground', DEFAULT_GSC_CONTENT.home_ground);
  const gscTeamName = getContentString(gscContent, 'team_name', DEFAULT_GSC_CONTENT.team_name);
  const gscTeamColor = getContentString(gscContent, 'team_color', DEFAULT_GSC_CONTENT.team_color);

  // Records
  const recordsItems = getContentArray(recordsContent, 'records_items', DEFAULT_RECORDS_CONTENT.records_items);

  // Media
  const mediaText = getContentString(mediaContent, 'text', DEFAULT_MEDIA_CONTENT.text);
  const stat1Value = getContentString(mediaContent, 'stat1_value', DEFAULT_MEDIA_CONTENT.stat1_value);
  const stat1Label = getContentString(mediaContent, 'stat1_label', DEFAULT_MEDIA_CONTENT.stat1_label);
  const stat2Value = getContentString(mediaContent, 'stat2_value', DEFAULT_MEDIA_CONTENT.stat2_value);
  const stat2Label = getContentString(mediaContent, 'stat2_label', DEFAULT_MEDIA_CONTENT.stat2_label);
  const stat3Value = getContentString(mediaContent, 'stat3_value', DEFAULT_MEDIA_CONTENT.stat3_value);
  const stat3Label = getContentString(mediaContent, 'stat3_label', DEFAULT_MEDIA_CONTENT.stat3_label);

  // Contact
  const contactEmail = getContentString(contactContent, 'email', DEFAULT_CONTACT_CONTENT.email);
  const contactSocial = getContentString(contactContent, 'social', DEFAULT_CONTACT_CONTENT.social);
  const contactWebsite = getContentString(contactContent, 'website', DEFAULT_CONTACT_CONTENT.website);
  const contactPressEmail = getContentString(contactContent, 'press_email', DEFAULT_CONTACT_CONTENT.press_email);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Match History */}
      <EditableSection sectionId="about-history" pageId="about" type="text" title="Match History" content={{ ...DEFAULT_HISTORY_CONTENT }}>
        <motion.div variants={item} className="lux-card-gold">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="clipboard" className="w-3.5 h-3.5 text-gold" /></span> Match History
          </h2>
          {historyParagraphs[0] && (
            <p className="text-text-primary text-sm leading-relaxed mb-4">
              {historyParagraphs[0]}
            </p>
          )}
          {historyParagraphs[1] && (
            <p className="text-text-secondary text-sm leading-relaxed">
              {historyParagraphs[1]}
            </p>
          )}
        </motion.div>
      </EditableSection>

      {/* School Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* St.Thomas' College Matale */}
        <EditableSection sectionId="about-stc" pageId="about" type="text" title="St.Thomas' College Info" content={{ ...DEFAULT_STC_CONTENT }}>
          <motion.div variants={item} className="lux-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 relative flex-shrink-0">
                <Image
                  src={stcLogo}
                  alt="St.Thomas' College Matale"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <h2 className="card-title mb-0">
                <span className="icon"><PremiumIcon name="star" className="w-3.5 h-3.5 text-gold" /></span> St.Thomas&apos; College
              </h2>
            </div>
            <div className="space-y-0">
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Location</span>
                <span className="text-text-primary text-xs font-medium">{stcLocation}</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Home Ground</span>
                <span className="text-text-primary text-xs font-medium">{stcHomeGround}</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Team Name</span>
                <span className="text-gold text-xs font-medium">{stcTeamName}</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Team Color</span>
                <span className="text-gold text-xs font-medium">{stcTeamColor}</span>
              </div>
            </div>
          </motion.div>
        </EditableSection>

        {/* Govt.Science College Matale */}
        <EditableSection sectionId="about-gsc" pageId="about" type="text" title="Govt.Science College Info" content={{ ...DEFAULT_GSC_CONTENT }}>
          <motion.div variants={item} className="lux-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 relative flex-shrink-0">
                <Image
                  src={gscLogo}
                  alt="Govt.Science College Matale"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <h2 className="card-title mb-0">
                <span className="icon"><PremiumIcon name="star" className="w-3.5 h-3.5 text-[#E63946]" /></span> Govt.Science College
              </h2>
            </div>
            <div className="space-y-0">
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Location</span>
                <span className="text-text-primary text-xs font-medium">{gscLocation}</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Home Ground</span>
                <span className="text-text-primary text-xs font-medium">{gscHomeGround}</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Team Name</span>
                <span className="text-[#E63946] text-xs font-medium">{gscTeamName}</span>
              </div>
              <div className="stat-row">
                <span className="text-text-secondary text-xs">Team Color</span>
                <span className="text-[#E63946] text-xs font-medium">{gscTeamColor}</span>
              </div>
            </div>
          </motion.div>
        </EditableSection>
      </div>

      {/* Records Table */}
      <EditableSection sectionId="about-records" pageId="about" type="stats" title="Records" content={{ ...DEFAULT_RECORDS_CONTENT }}>
        <motion.div variants={item} className="lux-card">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="trophy" className="w-3.5 h-3.5 text-gold" /></span> Records
          </h2>
          <div className="overflow-x-auto">
            <table className="lux-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th className="text-center">STC</th>
                  <th className="text-center">GSC</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {recordsItems.map((record: { label: string; team1: string; team2: string; detail: string }) => (
                  <tr key={record.label}>
                    <td className="text-text-primary font-medium text-xs">{record.label}</td>
                    <td className="text-center text-gold text-xs">{record.team1}</td>
                    <td className="text-center text-text-secondary text-xs">{record.team2}</td>
                    <td className="text-text-muted text-xs">{record.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </EditableSection>

      {/* About Thomians' Media */}
      <EditableSection sectionId="about-media" pageId="about" type="text" title="About Thomians' Media" content={{ ...DEFAULT_MEDIA_CONTENT }}>
        <motion.div variants={item} className="lux-card-gold">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="broadcast" className="w-3.5 h-3.5 text-gold" /></span> About Thomians&apos; Media
          </h2>
          <p className="text-text-primary text-sm leading-relaxed mb-4">
            {mediaText}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="text-center py-4 bg-lux-surface">
              <p className="text-2xl font-bold text-gold">{stat1Value}</p>
              <p className="text-[9px] uppercase tracking-[2px] text-text-muted mt-1">{stat1Label}</p>
            </div>
            <div className="text-center py-4 bg-lux-surface">
              <p className="text-2xl font-bold text-gold">{stat2Value}</p>
              <p className="text-[9px] uppercase tracking-[2px] text-text-muted mt-1">{stat2Label}</p>
            </div>
            <div className="text-center py-4 bg-lux-surface">
              <p className="text-2xl font-bold text-gold">{stat3Value}</p>
              <p className="text-[9px] uppercase tracking-[2px] text-text-muted mt-1">{stat3Label}</p>
            </div>
          </div>
        </motion.div>
      </EditableSection>

      {/* Contact Info */}
      <EditableSection sectionId="about-contact" pageId="about" type="text" title="Contact Us" content={{ ...DEFAULT_CONTACT_CONTENT }}>
        <motion.div variants={item} className="lux-card">
          <h2 className="card-title">
            <span className="icon"><PremiumIcon name="chat" className="w-3.5 h-3.5 text-gold" /></span> Contact Us
          </h2>
          <div className="space-y-0">
            <div className="stat-row">
              <span className="text-text-secondary text-xs">Email</span>
              <span className="text-gold text-xs font-medium">{contactEmail}</span>
            </div>
            <div className="stat-row">
              <span className="text-text-secondary text-xs">Social</span>
              <span className="text-text-primary text-xs font-medium">{contactSocial}</span>
            </div>
            <div className="stat-row">
              <span className="text-text-secondary text-xs">Website</span>
              <span className="text-gold text-xs font-medium">{contactWebsite}</span>
            </div>
            <div className="stat-row">
              <span className="text-text-secondary text-xs">Press inquiries</span>
              <span className="text-text-primary text-xs font-medium">{contactPressEmail}</span>
            </div>
          </div>
        </motion.div>
      </EditableSection>

      <DynamicSections pageId="about" />
    </motion.div>
  );
}
