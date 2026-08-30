import os

src_dir = "src"
out_file = "src_dump.md"

with open(out_file, "w") as f:
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith((".jsx", ".js", ".css")):
                filepath = os.path.join(root, file)
                f.write(f"\n\n# {filepath}\n")
                f.write("```" + ("javascript" if file.endswith(".js") else "jsx" if file.endswith(".jsx") else "css") + "\n")
                with open(filepath, "r") as infile:
                    f.write(infile.read())
                f.write("\n```\n")

print(f"Consolidated source written to {out_file}")
