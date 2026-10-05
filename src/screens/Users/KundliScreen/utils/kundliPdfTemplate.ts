import moment from 'moment';
import { generatePDF as htmlToPdfConvert } from 'react-native-html-to-pdf';

export interface KundliPdfParams {
  userName: string;
  dob: string;
  tob: string;
  pob: string;
  latVal: string;
  lonVal: string;
  tzVal: string;
  rashi: string;
  nakshatra: string;
  tithi: string;
  yoga: string;
  karana: string;
  vaara: string;
  lagnaSign: string;
  currentDashaText: string;
  reportId: string;
  generatedOn: string;
  planetRowsHtml: string;
  dashaRowsHtml: string;
  chartImages: {
    lagna?: string;
    navamsa?: string;
    sun?: string;
    moon?: string;
    dasamsa?: string;
  };
  bullets: string[];
  yogas: string[];
  strengths: string[];
  t: (key: string) => string;
}

export const generateKundliPdfHtml = ({
  userName,
  dob,
  tob,
  pob,
  latVal,
  lonVal,
  tzVal,
  rashi,
  nakshatra,
  tithi,
  yoga,
  karana,
  vaara,
  lagnaSign,
  currentDashaText,
  reportId,
  generatedOn,
  planetRowsHtml,
  dashaRowsHtml,
  chartImages,
  bullets,
  yogas,
  strengths,
  t,
}: KundliPdfParams): string => {
  const formatMarkdown = (txt: string) =>
    txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>PujaGuru Vedic Kundli - ${userName}</title>
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            background-color: #FFFFFF;
            color: #1E293B;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
          }
          .pdf-page {
            width: 100%;
            height: 745px;
            max-height: 745px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
            box-sizing: border-box;
            overflow: hidden;
          }
          .pdf-page:last-child {
            page-break-after: avoid;
          }
          .page-header {
            flex-shrink: 0;
            margin-bottom: 6px;
          }
          .page-body {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          .page-footer {
            flex-shrink: 0;
            margin-top: auto;
            width: 100%;
          }

          /* Header Banner - Symmetric & Aligned on All Pages */
          .header-banner {
            border-bottom: 2px solid #D97706;
            padding-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .om-emblem {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #FFFBEB;
            border: 1.5px solid #D97706;
            color: #E7503D;
            font-size: 20px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }
          .brand-text-col {
            display: flex;
            flex-direction: column;
          }
          .brand-name {
            font-size: 18px;
            font-weight: 800;
            color: #E7503D;
            letter-spacing: 1px;
            line-height: 1.1;
            text-transform: uppercase;
          }
          .brand-sub {
            font-size: 8px;
            color: #92400E;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-top: 2px;
          }
          .brand-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 2px;
          }
          .report-badge {
            background: #FFF1F2;
            color: #E7503D;
            border: 1px solid #FECDD3;
            border-radius: 4px;
            padding: 1.5px 6px;
            font-weight: 800;
            font-size: 7.5px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 1px;
          }
          .meta-row {
            font-size: 8px;
            color: #64748B;
            line-height: 1.2;
          }
          .meta-row strong {
            color: #334155;
          }

          /* Footer - Bottom Pinned & Consistent on All Pages */
          .footer-box {
            width: 100%;
            border-top: 1.5px solid #E2E8F0;
            padding-top: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8px;
            color: #64748B;
          }
          .footer-brand {
            font-weight: 800;
            color: #E7503D;
            letter-spacing: 0.5px;
          }
          .footer-dot {
            margin: 0 5px;
            color: #CBD5E1;
          }
          .footer-right {
            font-weight: 700;
            color: #475569;
          }

          /* Section Headers */
          .section-heading {
            background: linear-gradient(90deg, #FEF3C7, #FFFBEB);
            border-left: 3.5px solid #D97706;
            padding: 4px 8px;
            margin: 8px 0 6px 0;
            border-radius: 0 4px 4px 0;
          }
          .section-heading h2 {
            margin: 0;
            font-size: 10px;
            font-weight: 800;
            color: #78350F;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          /* Info Table (Panchang) */
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            border: 1px solid #CBD5E1;
            border-radius: 4px;
            overflow: hidden;
          }
          .info-table td {
            padding: 4.5px 8px;
            border: 1px solid #F1F5F9;
            font-size: 9.5px;
          }
          .info-label {
            background-color: #F8FAFC;
            color: #475569;
            font-weight: 600;
            width: 22%;
          }
          .info-value {
            color: #0F172A;
            font-weight: 700;
            width: 28%;
          }

          /* Primary Charts Grid */
          .charts-row-2 {
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }
          .chart-card-box {
            flex: 1;
            border: 1.5px solid #FCD34D;
            border-radius: 8px;
            background: #FFFDF9;
            padding: 8px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .chart-title-label {
            font-size: 10px;
            font-weight: 800;
            color: #991B1B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            padding-bottom: 3px;
            border-bottom: 1px dashed #FDE68A;
            width: 100%;
          }
          .chart-img-rendered {
            width: 100%;
            max-width: 250px;
            height: auto;
            margin: 0 auto;
            display: block;
            border-radius: 4px;
            background: #FFFFFF;
          }

          /* Secondary Charts Grid */
          .charts-row-3 {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 6px;
          }
          .chart-card-box-sm {
            flex: 1;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            background: #FAFAFA;
            padding: 6px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .chart-card-box-sm .chart-title-label {
            font-size: 9px;
            font-weight: 700;
            color: #B45309;
            margin-bottom: 4px;
            width: 100%;
          }
          .chart-card-box-sm img {
            max-width: 175px;
            width: 100%;
            height: auto;
            border-radius: 4px;
          }

          /* Data Tables */
          .styled-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            border: 1px solid #CBD5E1;
          }
          .styled-table th {
            background-color: #991B1B;
            color: #FFFFFF;
            font-size: 8.5px;
            font-weight: 700;
            padding: 5px 6px;
            letter-spacing: 0.3px;
            border: 1px solid #7F1D1D;
          }
          .styled-table td {
            padding: 4.5px 6px;
            font-size: 8.5px;
            border: 1px solid #E2E8F0;
            color: #1E293B;
          }
          .styled-table th.center-col, .styled-table td.center-col {
            text-align: center;
          }
          .styled-table th.left-col, .styled-table td.left-col {
            text-align: left;
          }
          .styled-table tr:nth-child(even) {
            background-color: #F8FAFC;
          }
          .styled-table tr.asc-row {
            background-color: #FEF3C7;
            font-weight: bold;
          }
          .styled-table tr.active-row {
            background-color: #ECFDF5;
            font-weight: 600;
          }
          .active-badge {
            display: inline-block;
            background: #10B981;
            color: #FFFFFF;
            padding: 1.5px 6px;
            border-radius: 8px;
            font-size: 7.5px;
            font-weight: 700;
            text-transform: uppercase;
          }

          /* Cards */
          .bullet-card {
            border-left: 3px solid #E7503D;
            background: #FFFFFF;
            border-top: 1px solid #E2E8F0;
            border-right: 1px solid #E2E8F0;
            border-bottom: 1px solid #E2E8F0;
            border-radius: 4px;
            padding: 5px 9px;
            margin-bottom: 5px;
            font-size: 9px;
            line-height: 1.4;
          }
          .yoga-pill-card {
            border-left: 3px solid #D97706;
            background: #FFFDF9;
            border-top: 1px solid #FDE68A;
            border-right: 1px solid #FDE68A;
            border-bottom: 1px solid #FDE68A;
            border-radius: 4px;
            padding: 5px 9px;
            margin-bottom: 5px;
            font-size: 9px;
          }
          .strength-pill-card {
            border-left: 3px solid #059669;
            background: #F0FDF4;
            border-top: 1px solid #A7F3D0;
            border-right: 1px solid #A7F3D0;
            border-bottom: 1px solid #A7F3D0;
            border-radius: 4px;
            padding: 5px 9px;
            margin-bottom: 5px;
            font-size: 9px;
          }

          /* Shloka & Disclaimer */
          .shloka-block {
            margin: 6px 0 4px 0;
            text-align: center;
          }
          .shloka-text {
            color: #B45309;
            font-size: 9.5px;
            font-weight: 600;
            margin-bottom: 2px;
          }
          .shloka-trans {
            color: #92400E;
            font-size: 8px;
            font-style: italic;
            margin-bottom: 4px;
          }
          .disclaimer-note {
            color: #94A3B8;
            font-size: 7.5px;
            line-height: 1.35;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <!-- ================= PAGE 1 ================= -->
        <div class="pdf-page">
          <div class="page-header">
            <div class="header-banner">
              <div class="brand-left">
                <div class="om-emblem">ॐ</div>
                <div class="brand-text-col">
                  <div class="brand-name">PUJAGURU</div>
                  <div class="brand-sub">VEDIC HOROSCOPE & KUNDLI DOSSIER • LAHIRI AYANAMSA</div>
                </div>
              </div>
              <div class="brand-right">
                <div class="report-badge">CONFIDENTIAL REPORT</div>
                <div class="meta-row"><strong>ID:</strong> ${reportId}</div>
                <div class="meta-row"><strong>Date:</strong> ${generatedOn}</div>
              </div>
            </div>
          </div>

          <div class="page-body">
            <!-- Profile & Panchang Details -->
            <div class="section-heading">
              <h2>1. Birth Particulars & Vedic Panchang</h2>
            </div>
            <table class="info-table">
              <tr>
                <td class="info-label">Full Name</td>
                <td class="info-value">${userName}</td>
                <td class="info-label">Ascendant (Lagna)</td>
                <td class="info-value">${lagnaSign}</td>
              </tr>
              <tr>
                <td class="info-label">Date of Birth</td>
                <td class="info-value">${dob}</td>
                <td class="info-label">Moon Sign (Rashi)</td>
                <td class="info-value">${rashi}</td>
              </tr>
              <tr>
                <td class="info-label">Time of Birth</td>
                <td class="info-value">${tob}</td>
                <td class="info-label">Nakshatra</td>
                <td class="info-value">${nakshatra}</td>
              </tr>
              <tr>
                <td class="info-label">Place of Birth</td>
                <td class="info-value">${pob}</td>
                <td class="info-label">Vedic Tithi</td>
                <td class="info-value">${tithi}</td>
              </tr>
              <tr>
                <td class="info-label">Coordinates</td>
                <td class="info-value">${latVal}° N, ${lonVal}° E (${tzVal})</td>
                <td class="info-label">Yoga & Karana</td>
                <td class="info-value">${yoga} • ${karana}</td>
              </tr>
              <tr>
                <td class="info-label">Weekday (Vaara)</td>
                <td class="info-value">${vaara}</td>
                <td class="info-label">Current Dasha</td>
                <td class="info-value">${currentDashaText}</td>
              </tr>
            </table>

            <!-- Primary Charts -->
            <div class="section-heading">
              <h2>2. Primary Birth Charts</h2>
            </div>
            <div class="charts-row-2">
              ${
                chartImages.lagna
                  ? `
                  <div class="chart-card-box">
                    <div class="chart-title-label">${
                      t('lagna_birth_chart') || 'Lagna Birth Chart (D1)'
                    }</div>
                    <img src="data:image/jpeg;base64,${
                      chartImages.lagna
                    }" class="chart-img-rendered" />
                  </div>
                  `
                  : ''
              }
              ${
                chartImages.navamsa
                  ? `
                  <div class="chart-card-box">
                    <div class="chart-title-label">${
                      t('navamsa_destiny_chart') || 'Navamsa Destiny Chart (D9)'
                    }</div>
                    <img src="data:image/jpeg;base64,${
                      chartImages.navamsa
                    }" class="chart-img-rendered" />
                  </div>
                  `
                  : ''
              }
            </div>
          </div>

          <div class="page-footer">
            <div class="footer-box">
              <div class="footer-left">
                <span class="footer-brand">PUJAGURU</span>
                <span class="footer-dot">•</span>
                <span>Vedic Astrology Dossier</span>
                <span class="footer-dot">•</span>
                <span>Confidential</span>
              </div>
              <div class="footer-right">
                <span>Page 1 of 3</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= PAGE 2 ================= -->
        <div class="pdf-page">
          <div class="page-header">
            <div class="header-banner">
              <div class="brand-left">
                <div class="om-emblem">ॐ</div>
                <div class="brand-text-col">
                  <div class="brand-name">PUJAGURU</div>
                  <div class="brand-sub">VEDIC HOROSCOPE & KUNDLI DOSSIER • LAHIRI AYANAMSA</div>
                </div>
              </div>
              <div class="brand-right">
                <div class="report-badge">CONFIDENTIAL REPORT</div>
                <div class="meta-row"><strong>Native:</strong> ${userName}</div>
                <div class="meta-row"><strong>Ref:</strong> ${reportId}</div>
              </div>
            </div>
          </div>

          <div class="page-body">
            <!-- Secondary Charts -->
            <div class="section-heading">
              <h2>3. Divisional & Solar/Lunar Charts</h2>
            </div>
            <div class="charts-row-3">
              ${
                chartImages.sun
                  ? `
                  <div class="chart-card-box-sm">
                    <div class="chart-title-label">${
                      t('surya_kundli') || 'Surya Kundli'
                    }</div>
                    <img src="data:image/jpeg;base64,${chartImages.sun}" />
                  </div>
                  `
                  : ''
              }
              ${
                chartImages.moon
                  ? `
                  <div class="chart-card-box-sm">
                    <div class="chart-title-label">${
                      t('chandra_kundli') || 'Chandra Kundli'
                    }</div>
                    <img src="data:image/jpeg;base64,${chartImages.moon}" />
                  </div>
                  `
                  : ''
              }
              ${
                chartImages.dasamsa
                  ? `
                  <div class="chart-card-box-sm">
                    <div class="chart-title-label">${
                      t('dasamsa_career_chart') || 'Dasamsa (D10) Career'
                    }</div>
                    <img src="data:image/jpeg;base64,${chartImages.dasamsa}" />
                  </div>
                  `
                  : ''
              }
            </div>

            <!-- Planetary Positions Table -->
            <div class="section-heading">
              <h2>4. Planetary Positions & Dignities (Graha Sthiti)</h2>
            </div>
            <table class="styled-table">
              <thead>
                <tr>
                  <th class="left-col">Planet (Graha)</th>
                  <th class="left-col">Sign (Rashi)</th>
                  <th class="center-col">Degree</th>
                  <th class="left-col">Sign Lord</th>
                  <th class="center-col">House</th>
                  <th class="left-col">Nakshatra & Pada</th>
                  <th class="left-col">Dignity / State</th>
                </tr>
              </thead>
              <tbody>
                ${planetRowsHtml}
              </tbody>
            </table>
          </div>

          <div class="page-footer">
            <div class="footer-box">
              <div class="footer-left">
                <span class="footer-brand">PUJAGURU</span>
                <span class="footer-dot">•</span>
                <span>Vedic Astrology Dossier</span>
                <span class="footer-dot">•</span>
                <span>Confidential</span>
              </div>
              <div class="footer-right">
                <span>Page 2 of 3</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= PAGE 3 ================= -->
        <div class="pdf-page">
          <div class="page-header">
            <div class="header-banner">
              <div class="brand-left">
                <div class="om-emblem">ॐ</div>
                <div class="brand-text-col">
                  <div class="brand-name">PUJAGURU</div>
                  <div class="brand-sub">VEDIC HOROSCOPE & KUNDLI DOSSIER • LAHIRI AYANAMSA</div>
                </div>
              </div>
              <div class="brand-right">
                <div class="report-badge">CONFIDENTIAL REPORT</div>
                <div class="meta-row"><strong>Native:</strong> ${userName}</div>
                <div class="meta-row"><strong>Ref:</strong> ${reportId}</div>
              </div>
            </div>
          </div>

          <div class="page-body">
            <!-- Vimshottari Mahadashas -->
            <div class="section-heading">
              <h2>5. Vimshottari Mahadasha Timeline</h2>
            </div>
            <table class="styled-table">
              <thead>
                <tr>
                  <th class="left-col">Dasha Lord</th>
                  <th class="center-col">Start Date</th>
                  <th class="center-col">End Date</th>
                  <th class="center-col">Duration</th>
                  <th class="center-col">Current Period Status</th>
                </tr>
              </thead>
              <tbody>
                ${dashaRowsHtml}
              </tbody>
            </table>

            <!-- AI Predictions / Life Insights -->
            ${
              bullets.length > 0
                ? `
                <div class="section-heading">
                  <h2>6. Key Life Predictions & Vedic Insights</h2>
                </div>
                <div>
                  ${bullets
                    .map(
                      b => `
                    <div class="bullet-card">
                      ${formatMarkdown(b)}
                    </div>
                  `,
                    )
                    .join('')}
                </div>
                `
                : ''
            }

            <!-- Auspicious Yogas & Strengths if available -->
            ${
              yogas.length > 0
                ? `
                <div class="section-heading">
                  <h2>7. Auspicious Yogas in Kundli</h2>
                </div>
                <div>
                  ${yogas
                    .map(
                      y => `
                    <div class="yoga-pill-card">
                      ${formatMarkdown(y)}
                    </div>
                  `,
                    )
                    .join('')}
                </div>
                `
                : ''
            }

            ${
              strengths.length > 0
                ? `
                <div class="section-heading">
                  <h2>8. Planetary Strengths (Graha Bala)</h2>
                </div>
                <div>
                  ${strengths
                    .map(
                      s => `
                    <div class="strength-pill-card">
                      ${formatMarkdown(s)}
                    </div>
                  `,
                    )
                    .join('')}
                </div>
                `
                : ''
            }

            <div class="shloka-block">
              <div class="shloka-text" style="font-family: 'Devanagari Sangam MN', 'Kohinoor Devanagari', 'Nirmala UI', sans-serif;">
                ॐ असतो मा सद्गमय । तमसो मा ज्योतिर्गमय । मृत्योर्मा अमृतं गमय ॥
              </div>
              <div class="shloka-trans">
                “Om Asato Ma Sadgamaya, Tamaso Ma Jyotirgamaya, Mrityor Ma Amritam Gamaya”
              </div>
              <div class="disclaimer-note">
                This Vedic Astrology Dossier is generated via PujaGuru’s astronomical calculation engine based on classical Parashari principles and the N.C. Lahiri (Chitrapaksha) Ayanamsa. Astrological guidance is designed to offer spiritual wisdom, foresight, and guidance for personal growth.
              </div>
            </div>
          </div>

          <div class="page-footer">
            <div class="footer-box">
              <div class="footer-left">
                <span class="footer-brand">PUJAGURU</span>
                <span class="footer-dot">•</span>
                <span>Your Spiritual Companion</span>
                <span class="footer-dot">•</span>
                <span>www.puja-guru.com</span>
              </div>
              <div class="footer-right">
                <span>Page 3 of 3</span>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export interface GenerateKundliPdfOptions {
  data: any;
  interpretation?: any;
  name?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  latitude?: number | string;
  longitude?: number | string;
  chartImages?: Record<string, string>;
  t: (key: string) => string;
}

export const generateKundliPdf = async ({
  data,
  interpretation,
  name,
  birthDate,
  birthTime,
  birthPlace,
  latitude,
  longitude,
  chartImages = {},
  t,
}: GenerateKundliPdfOptions): Promise<string | null> => {
  try {
    const user = data?.user_details || {};
    const userName = name || user.name || 'Seeker';
    const dob = birthDate
      ? moment(birthDate).format('DD MMMM YYYY')
      : user.birthdetails?.DOB
      ? `${user.birthdetails.DOB.day} ${moment()
          .month(user.birthdetails.DOB.month - 1)
          .format('MMMM')} ${user.birthdetails.DOB.year}`
      : '-';

    const tob = birthTime
      ? moment(birthTime, ['HH:mm:ss', 'HH:mm']).format('hh:mm A')
      : user.birthdetails?.TOB
      ? `${String(user.birthdetails.TOB.hour).padStart(2, '0')}:${String(
          user.birthdetails.TOB.min,
        ).padStart(2, '0')}`
      : '-';

    const pob = birthPlace || user.birthdetails?.POB?.name || '-';
    const latVal =
      latitude !== undefined && latitude !== null
        ? Number(latitude).toFixed(4)
        : user.birthdetails?.POB?.lat !== undefined
        ? Number(user.birthdetails.POB.lat).toFixed(4)
        : '-';
    const lonVal =
      longitude !== undefined && longitude !== null
        ? Number(longitude).toFixed(4)
        : user.birthdetails?.POB?.lon !== undefined
        ? Number(user.birthdetails.POB.lon).toFixed(4)
        : '-';
    const tzVal = user.birthdetails?.POB?.timezone
      ? `GMT+${user.birthdetails.POB.timezone}`
      : 'GMT+5.5';

    const rashi = user.rashi || '-';
    const nakshatra = user.nakshatra || '-';
    const tithi = user.tithi || '-';
    const yoga = user.yoga || '-';
    const karana = user.karana || '-';
    const vaara = user.vaara || '-';
    const lagnaSign = data?.D1?.ascendant?.sign || '-';

    const mahadashas = data?.Dashas?.Vimshottari?.mahadashas || {};
    const dashaList: any[] = Object.values(mahadashas).sort(
      (a: any, b: any) => a.dashaNum - b.dashaNum,
    );
    const now = moment();
    const activeDashaItem: any = dashaList.find((d: any) => {
      const startM = moment(d.startDate);
      const endM = moment(d.endDate);
      return now.isSameOrAfter(startM) && now.isSameOrBefore(endM);
    });

    const currentDashaObj = data?.D1?.Dashas?.current || data?.Dashas?.current;
    const currentDashaText = currentDashaObj
      ? `${currentDashaObj.dasha} • ${currentDashaObj.bhukti}${
          currentDashaObj.paryantardasha
            ? ' • ' + currentDashaObj.paryantardasha
            : ''
        }`
      : activeDashaItem
      ? `${activeDashaItem.lord} Mahadasha (till ${moment(
          activeDashaItem.endDate,
        ).format('YYYY')})`
      : '-';

    const reportId = `PG-KND-${Math.abs(
      userName
        .split('')
        .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 1000),
    )}-${moment().format('YYYY')}`;
    const generatedOn = moment().format('DD MMM YYYY, hh:mm A');

    // Planetary positions table
    const planets = data?.D1?.planets || {};
    const ascendant = data?.D1?.ascendant;
    const houses = data?.D1?.houses || [];

    const signLordMap: Record<string, string> = {
      Aries: 'Mars',
      Taurus: 'Venus',
      Gemini: 'Mercury',
      Cancer: 'Moon',
      Leo: 'Sun',
      Virgo: 'Mercury',
      Libra: 'Venus',
      Scorpio: 'Mars',
      Sagittarius: 'Jupiter',
      Capricorn: 'Saturn',
      Aquarius: 'Saturn',
      Pisces: 'Jupiter',
    };

    houses.forEach((h: any) => {
      if (h.sign && h['sign-lord']) {
        signLordMap[h.sign] = h['sign-lord'];
      }
    });

    const planetRowsHtml = [
      `
      <tr class="asc-row">
        <td><strong>Ascendant (Lagna)</strong></td>
        <td><strong>${ascendant?.sign || '-'}</strong></td>
        <td>${
          ascendant?.pos?.deg !== undefined
            ? `${ascendant.pos.deg.toFixed(2)}°`
            : '-'
        }</td>
        <td>${signLordMap[ascendant?.sign] || '-'}</td>
        <td>1</td>
        <td>-</td>
        <td>Lagna Kendra</td>
      </tr>
      `,
      ...Object.entries(planets).map(([pName, info]: [string, any]) => {
        const deg =
          info.pos?.deg !== undefined ? `${info.pos.deg.toFixed(2)}°` : '-';
        const nak = info.nakshatra
          ? `${info.nakshatra}${info.pada ? ' (P' + info.pada + ')' : ''}`
          : '-';
        const dignity =
          info['house-rel'] || (info.retro ? 'Retrograde' : 'Direct');
        return `
        <tr>
          <td>
            <strong>${pName}</strong>
            ${
              info.retro
                ? '<span style="color:#DC2626;font-weight:bold;margin-left:4px;">[R]</span>'
                : ''
            }
          </td>
          <td>${info.sign || '-'}</td>
          <td>${deg}</td>
          <td>${signLordMap[info.sign] || info.dispositor || '-'}</td>
          <td>${info['house-num'] ?? '-'}</td>
          <td>${nak}</td>
          <td>${dignity}</td>
        </tr>
        `;
      }),
    ].join('');

    // Vimshottari Mahadasha rows
    const dashaRowsHtml = dashaList
      .map((dasha: any) => {
        const startM = moment(dasha.startDate);
        const endM = moment(dasha.endDate);
        const isCurrent = now.isSameOrAfter(startM) && now.isSameOrBefore(endM);
        const startStr = dasha.startDate
          ? moment(dasha.startDate).format('DD MMM YYYY')
          : '-';
        const endStr = dasha.endDate
          ? moment(dasha.endDate).format('DD MMM YYYY')
          : '-';
        return `
        <tr class="${isCurrent ? 'active-row' : ''}">
          <td><strong>${dasha.lord}</strong></td>
          <td>${startStr}</td>
          <td>${endStr}</td>
          <td>${dasha.duration ? dasha.duration.trim() : '-'}</td>
          <td>
            ${
              isCurrent
                ? '<span class="active-badge">' +
                  (t('active_now') || 'Active Now') +
                  '</span>'
                : '<span style="color:#64748B;">Standard</span>'
            }
          </td>
        </tr>
        `;
      })
      .join('');

    const bullets: string[] = interpretation?.summary_bullets || [];
    const yogas: string[] = interpretation?.overview?.yogas || [];
    const strengths: string[] = interpretation?.overview?.strengths || [];

    const htmlContent = generateKundliPdfHtml({
      userName,
      dob,
      tob,
      pob,
      latVal,
      lonVal,
      tzVal,
      rashi,
      nakshatra,
      tithi,
      yoga,
      karana,
      vaara,
      lagnaSign,
      currentDashaText,
      reportId,
      generatedOn,
      planetRowsHtml,
      dashaRowsHtml,
      chartImages,
      bullets,
      yogas,
      strengths,
      t,
    });

    const options = {
      html: htmlContent,
      fileName: `Kundli_${userName.replace(
        /[^a-zA-Z0-9]/g,
        '_',
      )}_${Date.now()}`,
      directory: 'Documents',
      padding: 16,
    };

    const file = await htmlToPdfConvert(options);
    return file.filePath;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return null;
  }
};
