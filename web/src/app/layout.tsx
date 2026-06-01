import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TokenLens",
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
