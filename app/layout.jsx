import "./globals.css";

export const metadata = {
  title: "Threadline — Chat",
  description: "A real-time chat application UI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body text-ink antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}