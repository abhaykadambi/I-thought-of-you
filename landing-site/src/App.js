import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    background: #f8f5ee;
    font-family: 'Georgia', 'Times New Roman', serif;
    margin: 0;
    padding: 0;
    color: #2c2c2c;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

const Navbar = styled.nav`
  background: #fff9ed;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 0 40px;
  display: flex;
  align-items: center;
  height: 72px;
  border-bottom: 1px solid #ece6da;
  justify-content: space-between;
`;
const Brand = styled.div`
  font-family: 'Georgia', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #4a7cff;
  letter-spacing: 2px;
  user-select: none;
`;
const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
`;
const NavLink = styled(Link)`
  color: #4a7cff;
  text-decoration: none;
  font-weight: 500;
  font-size: 1.08rem;
  padding: 8px 0;
  transition: color 0.15s;
  &:hover {
    color: #346cff;
    text-decoration: underline;
  }
`;
const Container = styled.div`
  max-width: 700px;
  margin: 56px auto 0 auto;
  padding: 48px 32px 40px 32px;
  background: #fff9ed;
  border-radius: 22px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  text-align: center;
`;
const Title = styled.h1`
  font-size: 2.8rem;
  font-family: 'Georgia', serif;
  font-weight: 700;
  margin-bottom: 18px;
  letter-spacing: 1px;
  color: #2c2c2c;
`;
const Subtitle = styled.h2`
  font-size: 1.35rem;
  color: #4a7cff;
  font-family: 'Georgia', serif;
  font-weight: 400;
  margin-bottom: 36px;
  letter-spacing: 0.2px;
`;
const Description = styled.p`
  font-size: 1.18rem;
  color: #444;
  line-height: 1.7;
  margin-bottom: 38px;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-weight: 400;
  text-align: center;
`;
const Button = styled.a`
  display: inline-block;
  background: linear-gradient(90deg, #4a7cff 60%, #3498db 100%);
  color: white;
  font-size: 1.13rem;
  font-weight: 600;
  border: none;
  border-radius: 14px;
  padding: 17px 38px;
  margin: 16px 0 0 0;
  text-decoration: none;
  box-shadow: 0 2px 12px rgba(74,124,255,0.10);
  transition: background 0.18s, box-shadow 0.18s;
  letter-spacing: 0.5px;
  cursor: pointer;
  &:hover {
    background: linear-gradient(90deg, #346cff 60%, #217dbb 100%);
    box-shadow: 0 4px 18px rgba(74,124,255,0.13);
  }
`;

function Home() {
  return (
    <Container>
      <Title>You Were On My Mind</Title>
      <Subtitle>Moments that matter, shared instantly</Subtitle>
      <Description>
        <b>I Thought of You</b> is a beautifully simple way to let friends know they're on your mind.<br /><br />
        Effortlessly capture and share thoughtful moments, spark meaningful connections, and nurture relationships in a world that moves fast.<br /><br />
        <span style={{color:'#4a7cff', fontWeight:600}}>No feeds. No pressure. Just genuine, spontaneous sharing.</span>
      </Description>
      <Button href="#">Download the App</Button>
    </Container>
  );
}

function Terms() {
  return (
    <Container>
      <Title>Terms of Service</Title>
      <Subtitle>Effective Date: July 14, 2025</Subtitle>
      <Description style={{textAlign:'left', maxWidth: 600, margin: '0 auto'}}>
        Welcome to <b>I Thought of You</b> (“the App”, “we”, “us”, “our”). These Terms of Service (“Terms”) govern your use of the I Thought of You mobile application and related services. By using the App, you agree to be bound by these Terms.<br /><br />
        If you do not agree, do not use the App.<br /><br />
        <b>1. Eligibility</b><br />
        You must be at least 13 years old to use the App. By using the App, you confirm that you meet this requirement.<br /><br />
        <b>2. Account and User Responsibilities</b><br />
        You are responsible for maintaining the confidentiality of your login credentials.<br />
        You may not impersonate others or provide false information.<br />
        You are solely responsible for the content you send ("thoughts").<br /><br />
        <b>3. Acceptable Use</b><br />
        You agree not to:
        <ul style={{marginTop: 8, marginBottom: 16}}>
          <li>Use the App for any illegal, harmful, or abusive purposes.</li>
          <li>Harass, threaten, or impersonate others.</li>
          <li>Post or share content that is hateful, explicit, or otherwise violates community standards.</li>
          <li>Attempt to hack, overload, or interfere with the App’s systems or security.</li>
        </ul>
        We reserve the right to suspend or terminate accounts that violate these rules.<br /><br />
        <b>4. Privacy</b><br />
        Your use of the App is also governed by our Privacy Policy. We do not sell your data and take privacy seriously.<br /><br />
        <b>5. Intellectual Property</b><br />
        All content, trademarks, logos, and features within the App are the property of I Thought of You or its licensors. You may not copy, modify, or distribute any part of the App without our written permission.<br /><br />
        <b>6. Termination</b><br />
        We reserve the right to terminate or suspend your access to the App at any time, for any reason, including violations of these Terms.<br /><br />
        <b>7. Disclaimer</b><br />
        The App is provided “as is” without warranties of any kind. We do not guarantee that the App will always be available, error-free, or secure.<br /><br />
        <b>8. Limitation of Liability</b><br />
        To the fullest extent allowed by law, I Thought of You is not liable for any indirect, incidental, or consequential damages arising from your use of the App.<br /><br />
        <b>9. Changes to the Terms</b><br />
        We may update these Terms from time to time. If we make material changes, we will notify you by app notice or email. Continued use after changes means you accept the new Terms.<br /><br />
        <b>10. Contact Us</b><br />
        For questions or support, contact us at:<br />
        <span role="img" aria-label="email">📧</span> <a href="mailto:ithoughtofyouapp@gmail.com" style={{color:'#4a7cff'}}>ithoughtofyouapp@gmail.com</a>
      </Description>
    </Container>
  );
}

function Privacy() {
  return (
    <Container>
      <Title>Privacy Policy for I Thought of You</Title>
      <Subtitle>Effective Date: July 14, 2025</Subtitle>
      <Description style={{textAlign:'left', maxWidth: 600, margin: '0 auto'}}>
        <b>At I Thought of You, we value your privacy and are committed to protecting your personal data. This policy outlines what data we collect, how it's used, and your rights as a user.</b>
        <br /><br />
        <b>1. Information We Collect</b><br />
        <ul style={{marginTop: 8, marginBottom: 16}}>
          <li><b>Account Information:</b> Your name, email, or phone number when you register.</li>
          <li><b>Friend Connections:</b> IDs of friends you've added to enable sending/receiving thoughts.</li>
          <li><b>User Content:</b> Thoughts you send or receive are stored securely and privately.</li>
          <li><b>Device Data:</b> Basic usage analytics (e.g., device type, OS) to improve performance.</li>
        </ul>
        <b>2. How We Use Your Information</b><br />
        <ul style={{marginTop: 8, marginBottom: 16}}>
          <li>To enable core features (sending/receiving thoughts)</li>
          <li>To maintain and improve the app</li>
          <li>To provide customer support</li>
          <li>To analyze usage trends (in aggregate, not linked to individuals)</li>
        </ul>
        <span style={{color:'#4a7cff'}}>We do not use your data for advertising or sell your information to third parties.</span>
        <br /><br />
        <b>3. Data Sharing</b><br />
        We do not share your personal data with third parties except:
        <ul style={{marginTop: 8, marginBottom: 16}}>
          <li>When required by law</li>
          <li>To trusted infrastructure providers (e.g., database or backend services) under strict data protection agreements</li>
        </ul>
        <b>4. Data Security</b><br />
        We use secure protocols (e.g., HTTPS, encryption in transit and at rest) and industry-standard best practices to protect your data.
        <br /><br />
        <b>5. Your Rights</b><br />
        You have the right to:
        <ul style={{marginTop: 8, marginBottom: 16}}>
          <li>Access or correct your personal data</li>
          <li>Delete your account and associated data</li>
          <li>Contact us with questions or concerns at: <a href="mailto:ithoughtofyouapp@gmail.com" style={{color:'#4a7cff'}}>ithoughtofyouapp@gmail.com</a></li>
        </ul>
        <b>6. Children's Privacy</b><br />
        This app is not intended for users under 13. We do not knowingly collect data from children.
        <br /><br />
        <b>7. Changes to This Policy</b><br />
        We may update this Privacy Policy as needed. Updates will be posted on this page.
        <br /><br />
        <b>Contact Us:</b><br />
        For questions or concerns, contact us at: <a href="mailto:ithoughtofyouapp@gmail.com" style={{color:'#4a7cff'}}>ithoughtofyouapp@gmail.com</a>
      </Description>
    </Container>
  );
}

function Support() {
  return (
    <Container>
      <Title>Support</Title>
      <Subtitle>We're here to help</Subtitle>
      <Description style={{textAlign:'left', maxWidth: 600, margin: '0 auto'}}>
        <b>Need help with I Thought of You?</b><br /><br />
        We're committed to providing excellent support for all our users. If you have any questions, concerns, or need assistance with the app, please don't hesitate to reach out to us.<br /><br />
        <b>Contact Information:</b><br />
        <span role="img" aria-label="email">📧</span> <a href="mailto:ithoughtofyouapp@gmail.com" style={{color:'#4a7cff'}}>ithoughtofyouapp@gmail.com</a><br /><br />
        <b>What we can help with:</b><br />
        <ul style={{marginTop: 8, marginBottom: 16}}>
          <li>Account issues and troubleshooting</li>
          <li>App functionality questions</li>
          <li>Privacy and security concerns</li>
          <li>Feature requests and feedback</li>
          <li>Technical support</li>
        </ul>
        <b>Response Time:</b><br />
        We typically respond to support inquiries within 24-48 hours during business days.<br /><br />
        <b>Before contacting us:</b><br />
        You might find answers to common questions in our <a href="/terms" style={{color:'#4a7cff'}}>Terms of Service</a> or <a href="/privacy" style={{color:'#4a7cff'}}>Privacy Policy</a> pages.
      </Description>
    </Container>
  );
}

function App() {
  return (
    <Router>
      <GlobalStyle />
      <Navbar>
        <Brand>I THOUGHT OF YOU</Brand>
        <NavLinks>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/terms">Terms of Service</NavLink>
          <NavLink to="/privacy">Privacy Policy</NavLink>
          <NavLink to="/support">Support</NavLink>
        </NavLinks>
      </Navbar>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/support" element={<Support />} />
      </Routes>
    </Router>
  );
}

export default App;
