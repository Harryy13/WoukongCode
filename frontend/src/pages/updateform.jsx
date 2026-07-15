import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axiosClient from "../utils/axiosClient";
import { useNavigate, useParams, NavLink } from "react-router";

const problemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  difficulty: z.enum(["easy", "medium", "hard"]),

  tags: z.enum(["array", "linkedlist", "graph", "dp", "stack"]),

  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, "Input is required"),
      output: z.string().min(1, "Output is required"),
      explanation: z.string().min(1, "Explanation is required"),
    })
  ).min(1),

  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, "Input is required"),
      output: z.string().min(1, "Output is required"),
    })
  ).min(1),

  startCode: z.array(
    z.object({
      language: z.enum(["c++", "java", "javascript"]),
      initialCode: z.string().min(1),
    })
  ).length(3),

  refrenceSolution: z.array(
    z.object({
      language: z.enum(["c++", "java", "javascript"]),
      completecode: z.string().min(1),
    })
  ).length(3),
});

const LANGUAGES = ["c++", "java", "javascript"];

// Real newlines <-> literal "\n" text, same convention used when the
// problem was originally created.
const encodeNewlines = (str) =>
  typeof str === "string" ? str.replace(/\n/g, "\\n") : str;

const decodeNewlines = (str) =>
  typeof str === "string" ? str.replace(/\\n/g, "\n") : str;

function UpdateForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      startCode: LANGUAGES.map((lang) => ({ language: lang, initialCode: "" })),
      refrenceSolution: LANGUAGES.map((lang) => ({ language: lang, completecode: "" })),
    },
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible,
  } = useFieldArray({
    control,
    name: "visibleTestCases",
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden,
  } = useFieldArray({
    control,
    name: "hiddenTestCases",
  });

  // Fetch the existing problem and fill every field, decoding the code
  // fields back into real newlines so they render properly in the textareas.
  useEffect(() => {
    const fetchProblem = async () => {
      setPageLoading(true);
      setLoadError(null);
      try {
        const { data } = await axiosClient.get(`/problems/problemById/${id}`);
        const probData = data?.problem ?? data;

        const startCode = LANGUAGES.map((lang) => {
          const found = (probData.startCode || []).find((sc) => sc.language === lang);
          return { language: lang, initialCode: found?.initialCode || "" };
        });

        const refSolutions = probData.refrenceSolution || probData.referenceSolution || [];
        const refrenceSolution = LANGUAGES.map((lang) => {
          const found = refSolutions.find((rs) => rs.language === lang);
          return { language: lang, completecode: found?.completecode || "" };
        });

        reset({
          title: probData.title || "",
          description: probData.description || "",
          difficulty: probData.difficulty || "",
          tags: probData.tags || "",
          visibleTestCases: probData.visibleTestCases?.length ? probData.visibleTestCases : [{ input: "", output: "", explanation: "" }],
          hiddenTestCases: probData.hiddenTestCases?.length ? probData.hiddenTestCases : [{ input: "", output: "" }],
          startCode,
          refrenceSolution,
        });
      } catch (err) {
        console.error("error fetching problem", err);
        setLoadError("Could not load this trial.");
      } finally {
        setPageLoading(false);
      }
    };

    fetchProblem();
  }, [id, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        startCode: data.startCode.map((sc) => ({
          ...sc,
          initialCode: sc.initialCode,
        })),
        refrenceSolution: data.refrenceSolution.map((rs) => ({
          ...rs,
          completecode: rs.completecode,
        })),
      };

      console.log(payload.refrenceSolution[0].completecode);

      await axiosClient.put(`/problems/update/${id}`, payload);
      alert("Problem updated successfully");
      navigate("/admin/update");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0a08]">
        <span className="loading loading-spinner loading-lg text-[#c9a24b]"></span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0b0a08]">
        <p className="text-sm text-[#c0453d]">{loadError}</p>
        <NavLink to="/admin/update" className="text-[11px] tracking-[0.15em] uppercase text-[#c9a24b] hover:text-[#e2be6d] transition-colors">
          ← Back to Update Trials
        </NavLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-[#0b0a08] overflow-x-hidden px-4 py-10">
      {/* ambient background: mist + ember glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#c9a24b]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#7a1616]/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #c9a24b 0px, transparent 1px, transparent 3px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* header / seal */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-14 h-14 rounded-full border-2 border-[#c9a24b] flex items-center justify-center mb-4 shadow-[0_0_25px_-5px_rgba(201,162,75,0.6)]">
            <span className="text-[#c9a24b] text-2xl font-bold">悟</span>
          </div>
          <h1 className="font-serif tracking-[0.2em] text-2xl sm:text-3xl text-[#e9dfc7] uppercase">
            Update Trial
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <span className="h-px w-8 bg-[#c9a24b]/50" />
            <p className="text-[11px] tracking-[0.25em] text-[#c9a24b]/80 uppercase">
              Reshape the Path
            </p>
            <span className="h-px w-8 bg-[#c9a24b]/50" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">

          {/* ===== Basic Info ===== */}
          <section className="bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)] px-6 py-8 sm:px-8">
            <h2 className="font-serif tracking-[0.15em] text-lg text-[#e9dfc7] uppercase mb-6">
              Basic Info
            </h2>

            <div className="flex flex-col gap-y-5">
              <div className="form-control w-full">
                <label className="label pb-1">
                  <span className="label-text text-[11px] tracking-[0.15em] uppercase text-[#a89a78]">
                    Title
                  </span>
                </label>
                <input
                  {...register("title")}
                  placeholder="Problem title"
                  className="input input-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors"
                />
                {errors.title && (
                  <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                    ⚠ {errors.title.message}
                  </span>
                )}
              </div>

              <div className="form-control w-full">
                <label className="label pb-1">
                  <span className="label-text text-[11px] tracking-[0.15em] uppercase text-[#a89a78]">
                    Description
                  </span>
                </label>
                <textarea
                  {...register("description")}
                  rows={5}
                  placeholder="Describe the trial..."
                  className="textarea textarea-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors font-mono text-sm"
                />
                {errors.description && (
                  <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                    ⚠ {errors.description.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="form-control w-full">
                  <label className="label pb-1">
                    <span className="label-text text-[11px] tracking-[0.15em] uppercase text-[#a89a78]">
                      Difficulty
                    </span>
                  </label>
                  <select
                    {...register("difficulty")}
                    className="select select-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors"
                  >
                    <option value="" disabled>Select difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  {errors.difficulty && (
                    <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                      ⚠ {errors.difficulty.message}
                    </span>
                  )}
                </div>

                <div className="form-control w-full">
                  <label className="label pb-1">
                    <span className="label-text text-[11px] tracking-[0.15em] uppercase text-[#a89a78]">
                      Tag
                    </span>
                  </label>
                  <select
                    {...register("tags")}
                    className="select select-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors"
                  >
                    <option value="" disabled>Select tag</option>
                    <option value="array">Array</option>
                    <option value="linkedlist">Linked List</option>
                    <option value="graph">Graph</option>
                    <option value="dp">DP</option>
                    <option value="stack">Stack</option>
                  </select>
                  {errors.tags && (
                    <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                      ⚠ {errors.tags.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ===== Visible Test Cases ===== */}
          <section className="bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)] px-6 py-8 sm:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif tracking-[0.15em] text-lg text-[#e9dfc7] uppercase">
                Visible Test Cases
              </h2>
              <button
                type="button"
                onClick={() => appendVisible({ input: "", output: "", explanation: "" })}
                className="text-[11px] tracking-[0.15em] uppercase text-[#c9a24b] border border-[#c9a24b]/40 px-3 py-1.5 hover:bg-[#c9a24b]/10 transition-colors"
              >
                + Add Case
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {visibleFields.map((field, index) => (
                <div key={field.id} className="border border-[#3a3226] p-4 relative">
                  <button
                    type="button"
                    onClick={() => removeVisible(index)}
                    className="absolute top-3 right-3 text-[10px] tracking-[0.15em] uppercase text-[#c0453d] hover:text-[#e2635a] transition-colors"
                  >
                    Remove
                  </button>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a24b]/70 mb-3">
                    Case #{index + 1}
                  </p>

                  <div className="flex flex-col gap-4">
                    <div className="form-control w-full">
                      <label className="label pb-1">
                        <span className="label-text text-[10px] tracking-[0.15em] uppercase text-[#a89a78]">
                          Input
                        </span>
                      </label>
                      <textarea
                        {...register(`visibleTestCases.${index}.input`)}
                        rows={2}
                        className="textarea textarea-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors font-mono text-sm"
                      />
                      {errors.visibleTestCases?.[index]?.input && (
                        <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                          ⚠ {errors.visibleTestCases[index].input.message}
                        </span>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label pb-1">
                        <span className="label-text text-[10px] tracking-[0.15em] uppercase text-[#a89a78]">
                          Output
                        </span>
                      </label>
                      <textarea
                        {...register(`visibleTestCases.${index}.output`)}
                        rows={2}
                        className="textarea textarea-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors font-mono text-sm"
                      />
                      {errors.visibleTestCases?.[index]?.output && (
                        <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                          ⚠ {errors.visibleTestCases[index].output.message}
                        </span>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label pb-1">
                        <span className="label-text text-[10px] tracking-[0.15em] uppercase text-[#a89a78]">
                          Explanation
                        </span>
                      </label>
                      <textarea
                        {...register(`visibleTestCases.${index}.explanation`)}
                        rows={2}
                        className="textarea textarea-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors font-mono text-sm"
                      />
                      {errors.visibleTestCases?.[index]?.explanation && (
                        <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                          ⚠ {errors.visibleTestCases[index].explanation.message}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ===== Hidden Test Cases ===== */}
          <section className="bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)] px-6 py-8 sm:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif tracking-[0.15em] text-lg text-[#e9dfc7] uppercase">
                Hidden Test Cases
              </h2>
              <button
                type="button"
                onClick={() => appendHidden({ input: "", output: "" })}
                className="text-[11px] tracking-[0.15em] uppercase text-[#c9a24b] border border-[#c9a24b]/40 px-3 py-1.5 hover:bg-[#c9a24b]/10 transition-colors"
              >
                + Add Case
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {hiddenFields.map((field, index) => (
                <div key={field.id} className="border border-[#3a3226] p-4 relative">
                  <button
                    type="button"
                    onClick={() => removeHidden(index)}
                    className="absolute top-3 right-3 text-[10px] tracking-[0.15em] uppercase text-[#c0453d] hover:text-[#e2635a] transition-colors"
                  >
                    Remove
                  </button>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a24b]/70 mb-3">
                    Case #{index + 1}
                  </p>

                  <div className="flex flex-col gap-4">
                    <div className="form-control w-full">
                      <label className="label pb-1">
                        <span className="label-text text-[10px] tracking-[0.15em] uppercase text-[#a89a78]">
                          Input
                        </span>
                      </label>
                      <textarea
                        {...register(`hiddenTestCases.${index}.input`)}
                        rows={2}
                        className="textarea textarea-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors font-mono text-sm"
                      />
                      {errors.hiddenTestCases?.[index]?.input && (
                        <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                          ⚠ {errors.hiddenTestCases[index].input.message}
                        </span>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label pb-1">
                        <span className="label-text text-[10px] tracking-[0.15em] uppercase text-[#a89a78]">
                          Output
                        </span>
                      </label>
                      <textarea
                        {...register(`hiddenTestCases.${index}.output`)}
                        rows={2}
                        className="textarea textarea-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors font-mono text-sm"
                      />
                      {errors.hiddenTestCases?.[index]?.output && (
                        <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                          ⚠ {errors.hiddenTestCases[index].output.message}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ===== Starter Code ===== */}
          <section className="bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)] px-6 py-8 sm:px-8">
            <h2 className="font-serif tracking-[0.15em] text-lg text-[#e9dfc7] uppercase mb-6">
              Starter Code
            </h2>

            <div className="flex flex-col gap-6">
              {LANGUAGES.map((lang, index) => (
                <div key={lang} className="border border-[#3a3226] p-4">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a24b]/70 mb-3">
                    {lang}
                  </p>
                  <input type="hidden" value={lang} {...register(`startCode.${index}.language`)} />
                  <textarea
                    {...register(`startCode.${index}.initialCode`)}
                    rows={6}
                    placeholder={`Starter code for ${lang}...`}
                    className="textarea textarea-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors font-mono text-sm"
                  />
                  {errors.startCode?.[index]?.initialCode && (
                    <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                      ⚠ {errors.startCode[index].initialCode.message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ===== Reference Solution ===== */}
          <section className="bg-[#141210]/95 border border-[#c9a24b]/30 shadow-[0_0_60px_-10px_rgba(201,162,75,0.25)] px-6 py-8 sm:px-8">
            <h2 className="font-serif tracking-[0.15em] text-lg text-[#e9dfc7] uppercase mb-6">
              Reference Solution
            </h2>

            <div className="flex flex-col gap-6">
              {LANGUAGES.map((lang, index) => (
                <div key={lang} className="border border-[#3a3226] p-4">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a24b]/70 mb-3">
                    {lang}
                  </p>
                  <input type="hidden" value={lang} {...register(`refrenceSolution.${index}.language`)} />
                  <textarea
                    {...register(`refrenceSolution.${index}.completecode`)}
                    rows={8}
                    placeholder={`Complete solution for ${lang}...`}
                    className="textarea textarea-bordered w-full bg-[#0f0e0c] border-[#3a3226] text-[#e9dfc7] placeholder:text-[#5c5340] rounded-none focus:outline-none focus:border-[#c9a24b] focus:ring-1 focus:ring-[#c9a24b]/60 transition-colors font-mono text-sm"
                  />
                  {errors.refrenceSolution?.[index]?.completecode && (
                    <span className="mt-1 text-xs text-[#c0453d] flex items-center gap-1">
                      ⚠ {errors.refrenceSolution[index].completecode.message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="btn w-full rounded-none border-0 bg-gradient-to-b from-[#e2be6d] to-[#a97e2e] text-[#1a1512] font-semibold tracking-[0.15em] uppercase hover:from-[#f0cd7e] hover:to-[#c9963c] hover:shadow-[0_0_25px_-3px_rgba(201,162,75,0.7)] transition-all py-3 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <div className="flex justify-center mt-8">
          <NavLink
            to="/admin/update"
            className="text-[11px] tracking-[0.15em] uppercase text-[#c9a24b] hover:text-[#e2be6d] transition-colors"
          >
            ← Back to Update Trials
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default UpdateForm;