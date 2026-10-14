import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Page, { Field, Modal, Notice } from "../../components/ui/Page";
import { profileApi, vehiclesApi } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
const blankVehicle = {
  make: "",
  model: "",
  color: "",
  registrationNumber: "",
  seats: 4,
  vehicleType: "hatchback",
};
export default function UserProfilePage() {
  const { user, signOut } = useAuth(),
    navigate = useNavigate();
  const [profile, setProfile] = useState({
      fullName: user?.user_metadata?.full_name || "Test Traveller",
      phone: "",
      bio: "",
    }),
    [vehicles, setVehicles] = useState([]),
    [vehicle, setVehicle] = useState(blankVehicle),
    [editingVehicle, setEditingVehicle] = useState(false),
    [editing, setEditing] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [deletion, setDeletion] = useState(0),
    [confirmation, setConfirmation] = useState("");
  useEffect(() => {
    let live = true;
    Promise.all([profileApi.me(), vehiclesApi.mine()])
      .then(([p, v]) => {
        if (live) {
          setProfile(p);
          setVehicles(v);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await profileApi.update({
        fullName: profile.fullName,
        phone: profile.phone || null,
        bio: profile.bio || null,
      });
      setEditing(false);
      setNotice("Profile updated.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function saveVehicle(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = Object.fromEntries(
        Object.keys(blankVehicle).map((k) => [
          k,
          k === "seats" ? Number(vehicle[k]) : vehicle[k],
        ]),
      );
      if (vehicle.id) await vehiclesApi.update(vehicle.id, payload);
      else await vehiclesApi.create(payload);
      setVehicles(await vehiclesApi.mine());
      setEditingVehicle(false);
      setNotice("Vehicle saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Your profile"
      description="Manage your personal details and vehicle."
      action={
        <button
          className="button secondary"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          Sign out
        </button>
      }
    >
      <Notice error>{error}</Notice>
      <Notice>{notice}</Notice>
      <div className="two-columns">
        <form className="card form-card" onSubmit={save}>
          <div className="row">
            <h2>Personal details</h2>
            <button
              type="button"
              className="text-button"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Close editor" : "Edit profile"}
            </button>
          </div>
          <span className="avatar large">{profile.fullName?.[0] || "Y"}</span>
          <div className="stack">
            <Field label="Full name">
              <input
                disabled={!editing}
                value={profile.fullName}
                minLength={2}
                maxLength={100}
                required
                onChange={(e) =>
                  setProfile((p) => ({ ...p, fullName: e.target.value }))
                }
              />
            </Field>
            <Field label="Email">
              <input disabled value={user?.email || ""} />
            </Field>
            <Field label="Phone">
              <input
                disabled={!editing}
                type="tel"
                minLength={7}
                maxLength={20}
                value={profile.phone || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </Field>
            <Field label="About you">
              <textarea
                disabled={!editing}
                maxLength={500}
                value={profile.bio || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, bio: e.target.value }))
                }
              />
            </Field>
            {editing && (
              <button className="button" disabled={busy}>
                Save changes
              </button>
            )}
          </div>
        </form>
        <section className="stack">
          <div className="card">
            <div className="row">
              <h2>Vehicle details</h2>
              <button
                className="text-button"
                onClick={() => {
                  setVehicle(blankVehicle);
                  setEditingVehicle(true);
                }}
              >
                Add vehicle
              </button>
            </div>
            {vehicles.length ? (
              vehicles.map((v) => (
                <article className="vehicle-row" key={v.id}>
                  <h3>
                    {v.make} {v.model}
                  </h3>
                  <p className="muted">
                    {v.registrationNumber} · {v.color} · {v.seats} seats
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setVehicle(v);
                      setEditingVehicle(true);
                    }}
                  >
                    Edit vehicle
                  </button>
                </article>
              ))
            ) : (
              <p className="muted">Add your vehicle before offering a ride.</p>
            )}
          </div>
          <div className="card">
            <h2>Verification</h2>
            <span className={`badge ${profile.isVerified ? "success" : ""}`}>
              {profile.isVerified ? "Verified profile" : "Not verified"}
            </span>
            <p className="muted">
              Verification is reviewed by the YatriVahan team.
            </p>
          </div>
          <div className="card">
            <h2>Ratings</h2>
            <strong className="price">
              {profile.ratingCount ? Number(profile.avgRating).toFixed(1) : "—"}
            </strong>
            <p className="muted">{profile.ratingCount || 0} reviews</p>
          </div>
        </section>
      </div>
      <section className="card danger-zone section-gap">
        <div>
          <h2>Delete account</h2>
          <p className="muted">
            Permanently remove your account and connected data.
          </p>
        </div>
        <button className="button secondary" onClick={() => setDeletion(1)}>
          Delete account
        </button>
      </section>
      {editingVehicle && (
        <Modal
          title={vehicle.id ? "Edit vehicle" : "Add vehicle"}
          onClose={() => setEditingVehicle(false)}
        >
          <form className="stack" onSubmit={saveVehicle}>
            <Notice error>{error}</Notice>
            <div className="form-grid">
              {[
                ["make", "Make"],
                ["model", "Model"],
                ["color", "Color"],
                ["registrationNumber", "Registration number"],
              ].map(([k, label]) => (
                <Field key={k} label={label}>
                  <input
                    required
                    minLength={
                      k === "registrationNumber" ? 4 : k === "model" ? 1 : 2
                    }
                    maxLength={
                      k === "registrationNumber"
                        ? 30
                        : k === "color"
                          ? 40
                          : k === "make"
                            ? 60
                            : 80
                    }
                    value={vehicle[k]}
                    onChange={(e) =>
                      setVehicle((v) => ({ ...v, [k]: e.target.value }))
                    }
                  />
                </Field>
              ))}
              <Field label="Passenger seats">
                <input
                  type="number"
                  min="1"
                  max="8"
                  required
                  value={vehicle.seats}
                  onChange={(e) =>
                    setVehicle((v) => ({ ...v, seats: e.target.value }))
                  }
                />
              </Field>
              <Field label="Vehicle type">
                <select
                  value={vehicle.vehicleType}
                  onChange={(e) =>
                    setVehicle((v) => ({ ...v, vehicleType: e.target.value }))
                  }
                >
                  {["hatchback", "sedan", "suv", "van", "other"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
            <button className="button" disabled={busy}>
              {busy ? "Saving…" : "Save vehicle"}
            </button>
          </form>
        </Modal>
      )}
      {deletion > 0 && (
        <Modal
          title={
            deletion === 1
              ? "Delete your account?"
              : "Confirm permanent deletion"
          }
          onClose={() => {
            setDeletion(0);
            setConfirmation("");
          }}
        >
          <p>
            This cannot be undone. Your rides, bookings and vehicles will also
            be deleted.
          </p>
          {deletion === 2 && (
            <Field label="Type DELETE to confirm">
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </Field>
          )}
          <div className="actions">
            <button className="button secondary" onClick={() => setDeletion(0)}>
              Keep account
            </button>
            <button
              disabled={busy || (deletion === 2 && confirmation !== "DELETE")}
              className="button"
              onClick={async () => {
                if (deletion === 1) return setDeletion(2);
                setBusy(true);
                try {
                  await profileApi.remove();
                  await signOut();
                  navigate("/");
                } catch (e) {
                  setError(e.message);
                  setDeletion(0);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {deletion === 1 ? "Continue" : "Delete permanently"}
            </button>
          </div>
        </Modal>
      )}
    </Page>
  );
}
