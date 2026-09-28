import {
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  WalletCards,
} from "lucide-react";

import { authApi } from "../api/authApi";

type LoginProps = {
  onLogin: (
    email: string,
    password: string
  ) => Promise<void>;
};

export function Login({
  onLogin,
}: LoginProps) {
  const [mode, setMode] =
    useState<"login" | "register">("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    if (mode === "register") {
      if (password.length < 8) {
        setError("Hasło musi mieć co najmniej 8 znaków.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Hasła nie są takie same.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await authApi.register(email, password);
      }

      // Po rejestracji od razu wykonujemy normalny login,
      // dzięki czemu App.tsx nie wymaga żadnej zmiany.
      await onLogin(email, password);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "";

      if (
        mode === "register" &&
        (message.includes("409") ||
          message.toLowerCase().includes("already exists"))
      ) {
        setError("Konto z tym adresem email już istnieje.");
      } else if (mode === "register") {
        setError(
          "Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie."
        );
      } else {
        setError("Nieprawidłowy email lub hasło.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError(null);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#050b16]
        text-white
      "
    >
      {/* Background glow */}
      <div
        className="
          pointer-events-none
          absolute
          -left-40
          -top-40
          h-[520px]
          w-[520px]
          rounded-full
          bg-blue-600/10
          blur-[120px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-48
          right-[-100px]
          h-[600px]
          w-[600px]
          rounded-full
          bg-violet-600/10
          blur-[140px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[500px]
          w-[500px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-cyan-500/[0.035]
          blur-[150px]
        "
      />

      <div
        className="
          relative
          z-10
          mx-auto
          grid
          min-h-screen
          max-w-[1400px]
          grid-cols-1
          lg:grid-cols-[1.1fr_0.9fr]
        "
      >
        {/* LEFT SIDE */}
        <section
          className="
            hidden
            flex-col
            justify-between
            px-12
            py-12
            lg:flex
            xl:px-20
            xl:py-16
          "
        >
          <div>
            <div
              className="
                inline-flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-violet-400/20
                  bg-violet-500/10
                  shadow-[0_0_40px_rgba(139,92,246,0.12)]
                "
              >
                <TrendingUp
                  className="
                    h-5
                    w-5
                    text-violet-300
                  "
                />
              </div>

              <div>
                <p
                  className="
                    text-xl
                    font-black
                    tracking-[0.2em]
                    text-white
                  "
                >
                  FREEDOM
                </p>

                <p
                  className="
                    mt-0.5
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.24em]
                    text-slate-500
                  "
                >
                  Wealth Operating System
                </p>
              </div>
            </div>
          </div>

          <div
            className="
              max-w-2xl
              pb-12
            "
          >
            <div
              className="
                mb-7
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-emerald-400/15
                bg-emerald-400/[0.06]
                px-3
                py-1.5
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-emerald-400
                  shadow-[0_0_10px_rgba(52,211,153,0.8)]
                "
              />

              <span
                className="
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-emerald-300
                "
              >
                System online
              </span>
            </div>

            <h1
              className="
                max-w-xl
                text-5xl
                font-black
                leading-[1.05]
                tracking-[-0.04em]
                text-white
                xl:text-6xl
              "
            >
              Build wealth.
              <br />

              <span
                className="
                  bg-gradient-to-r
                  from-blue-400
                  via-violet-400
                  to-fuchsia-400
                  bg-clip-text
                  text-transparent
                "
              >
                Buy freedom.
              </span>
            </h1>

            <p
              className="
                mt-6
                max-w-lg
                text-base
                leading-7
                text-slate-400
              "
            >
              Jedno miejsce do kontroli
              majątku, cashflow, celów
              i drogi do finansowej
              niezależności.
            </p>

            <div
              className="
                mt-10
                grid
                max-w-xl
                grid-cols-3
                gap-3
              "
            >
              <Feature
                icon={WalletCards}
                title="Capital"
                description="Control"
              />

              <Feature
                icon={TrendingUp}
                title="Wealth"
                description="Growth"
              />

              <Feature
                icon={ShieldCheck}
                title="Freedom"
                description="Mission"
              />
            </div>
          </div>

          <p
            className="
              text-xs
              text-slate-600
            "
          >
            Your capital. Your strategy.
            Your freedom.
          </p>
        </section>

        {/* RIGHT SIDE */}
        <section
          className="
            flex
            min-h-screen
            items-center
            justify-center
            px-5
            py-10
            sm:px-8
            lg:px-12
          "
        >
          <div
            className="
              w-full
              max-w-[460px]
            "
          >
            {/* Mobile logo */}
            <div
              className="
                mb-10
                flex
                items-center
                gap-3
                lg:hidden
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-violet-400/20
                  bg-violet-500/10
                "
              >
                <TrendingUp
                  className="
                    h-5
                    w-5
                    text-violet-300
                  "
                />
              </div>

              <span
                className="
                  text-lg
                  font-black
                  tracking-[0.2em]
                "
              >
                FREEDOM
              </span>
            </div>

            <div
              className="
                relative
                overflow-hidden
                rounded-[28px]
                border
                border-white/[0.08]
                bg-[#0a1220]/80
                p-6
                shadow-[0_30px_100px_rgba(0,0,0,0.45)]
                backdrop-blur-xl
                sm:p-9
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute
                  left-10
                  right-10
                  top-0
                  h-px
                  bg-gradient-to-r
                  from-transparent
                  via-violet-400/50
                  to-transparent
                "
              />

              <div
                className="
                  mb-8
                "
              >
                <div
                  className="
                    mb-5
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-blue-400/15
                    bg-blue-500/[0.08]
                  "
                >
                  {mode === "login" ? (
                    <LockKeyhole
                      className="
                        h-5
                        w-5
                        text-blue-300
                      "
                    />
                  ) : (
                    <UserPlus
                      className="
                        h-5
                        w-5
                        text-blue-300
                      "
                    />
                  )}
                </div>

                <p
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.2em]
                    text-violet-400
                  "
                >
                  {mode === "login" ? "Secure access" : "New player"}
                </p>

                <h2
                  className="
                    mt-2
                    text-3xl
                    font-black
                    tracking-[-0.03em]
                  "
                >
                  {mode === "login" ? "Welcome back." : "Create account."}
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-500
                  "
                >
                  {mode === "login"
                    ? "Zaloguj się do swojego finansowego command center."
                    : "Załóż konto i rozpocznij budowę swojego finansowego systemu."}
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="
                      mb-2
                      block
                      text-[11px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-slate-400
                    "
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="you@freedom.pl"
                    className="
                      h-13
                      w-full
                      rounded-xl
                      border
                      border-white/[0.08]
                      bg-[#070e1a]
                      px-4
                      py-3.5
                      text-sm
                      text-white
                      outline-none
                      transition
                      placeholder:text-slate-700
                      focus:border-violet-400/50
                      focus:ring-4
                      focus:ring-violet-500/[0.08]
                    "
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="
                      mb-2
                      block
                      text-[11px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-slate-400
                    "
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      required
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder="••••••••••••"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-white/[0.08]
                        bg-[#070e1a]
                        px-4
                        py-3.5
                        pr-12
                        text-sm
                        text-white
                        outline-none
                        transition
                        placeholder:text-slate-700
                        focus:border-violet-400/50
                        focus:ring-4
                        focus:ring-violet-500/[0.08]
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) =>
                            !current
                        )
                      }
                      className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        cursor-pointer
                        text-slate-600
                        transition
                        hover:text-slate-300
                      "
                      aria-label={
                        showPassword
                          ? "Ukryj hasło"
                          : "Pokaż hasło"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {mode === "register" && (
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="
                        mb-2
                        block
                        text-[11px]
                        font-black
                        uppercase
                        tracking-[0.14em]
                        text-slate-400
                      "
                    >
                      Confirm password
                    </label>

                    <input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="••••••••••••"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-white/[0.08]
                        bg-[#070e1a]
                        px-4
                        py-3.5
                        text-sm
                        text-white
                        outline-none
                        transition
                        placeholder:text-slate-700
                        focus:border-violet-400/50
                        focus:ring-4
                        focus:ring-violet-500/[0.08]
                      "
                    />

                    <p className="mt-2 text-[10px] text-slate-600">
                      Minimum 8 znaków.
                    </p>
                  </div>
                )}

                {error && (
                  <div
                    className="
                      rounded-xl
                      border
                      border-red-400/15
                      bg-red-500/[0.06]
                      px-4
                      py-3
                      text-sm
                      font-semibold
                      text-red-300
                    "
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    group
                    flex
                    cursor-pointer
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-gradient-to-r
                    from-blue-600
                    to-violet-600
                    px-5
                    py-3.5
                    text-sm
                    font-black
                    text-white
                    shadow-[0_12px_35px_rgba(124,58,237,0.2)]
                    transition
                    hover:brightness-110
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {isSubmitting
                    ? mode === "login"
                      ? "AUTHENTICATING..."
                      : "CREATING ACCOUNT..."
                    : mode === "login"
                      ? "ENTER FREEDOM"
                      : "CREATE ACCOUNT"}

                  {!isSubmitting && (
                    <ArrowRight
                      className="
                        h-4
                        w-4
                        transition
                        group-hover:translate-x-1
                      "
                    />
                  )}
                </button>
              </form>

              <div
                className="
                  mt-6
                  border-t
                  border-white/[0.06]
                  pt-6
                  text-center
                "
              >
                <p className="text-xs text-slate-500">
                  {mode === "login"
                    ? "Nie masz jeszcze konta?"
                    : "Masz już konto?"}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    switchMode(
                      mode === "login" ? "register" : "login"
                    )
                  }
                  className="
                    mt-2
                    cursor-pointer
                    text-xs
                    font-black
                    text-violet-300
                    transition
                    hover:text-violet-200
                  "
                >
                  {mode === "login"
                    ? "CREATE ACCOUNT →"
                    : "← BACK TO SIGN IN"}
                </button>
              </div>

              <div
                className="
                  mt-7
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-[11px]
                  text-slate-600
                "
              >
                <ShieldCheck
                  className="
                    h-3.5
                    w-3.5
                    text-emerald-500
                  "
                />

                JWT secured session
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type FeatureProps = {
  icon: typeof WalletCards;
  title: string;
  description: string;
};

function Feature({
  icon: Icon,
  title,
  description,
}: FeatureProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/[0.06]
        bg-white/[0.025]
        p-4
        backdrop-blur
      "
    >
      <Icon
        className="
          mb-4
          h-4
          w-4
          text-violet-400
        "
      />

      <p
        className="
          text-xs
          font-black
          text-slate-200
        "
      >
        {title}
      </p>

      <p
        className="
          mt-1
          text-[10px]
          font-bold
          uppercase
          tracking-[0.12em]
          text-slate-600
        "
      >
        {description}
      </p>
    </div>
  );
}