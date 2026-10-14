import { Field } from "../ui/Page";
const places = [
  "Astarang",
  "Bhubaneswar",
  "Cuttack",
  "Puri",
  "Konark",
  "Kakatpur",
  "Nimapara",
  "Pipili",
];
export default function LocationFields({ origin, destination, onChange }) {
  return (
    <>
      <Field label="From">
        <input
          required
          maxLength={150}
          list="odisha-places"
          value={origin}
          onChange={(e) => onChange("origin", e.target.value)}
          placeholder="Starting town"
          autoComplete="off"
        />
      </Field>
      <Field label="To">
        <input
          required
          maxLength={150}
          list="odisha-places"
          value={destination}
          onChange={(e) => onChange("destination", e.target.value)}
          placeholder="Destination town"
          autoComplete="off"
        />
      </Field>
      <datalist id="odisha-places">
        {places.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </>
  );
}
