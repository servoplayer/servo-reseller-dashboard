export default function Footer() {
  return (
    <footer className="border-t border-line px-4 py-4 text-center text-xs text-subtle sm:px-6 lg:px-8">
      © {new Date().getFullYear()} Servo. All rights reserved.
    </footer>
  )
}
