export const metadata = {
  title: "Predy Dashboard",
  description: "Jarvis-style swarm dashboard with VeriBond trust view"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui, sans-serif", background: "#0B1020", color: "#E6ECFF" }}>
        {children}
      </body>
    </html>
  );
}
