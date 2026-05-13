import "./globals.css";

export const metadata = {
  title: "Lemonade Stand Leadership Council",
  description: "Build a three-leader council under a $10 budget.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
