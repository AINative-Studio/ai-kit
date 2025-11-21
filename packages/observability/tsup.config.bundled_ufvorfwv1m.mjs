// tsup.config.ts
import { defineConfig } from "tsup";
var tsup_config_default = defineConfig([
  // Core build - non-React observability features
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ["@ainative/ai-kit-core", "react", "recharts"],
    treeshake: true,
    minify: false
  }
  // React components build - Skip for now due to missing UI dependencies
  // TODO: Fix React component dependencies or create proper UI components
  // {
  //   entry: ['src/react/index.tsx'],
  //   format: ['esm', 'cjs'],
  //   dts: true,
  //   outDir: 'dist/react',
  //   splitting: false,
  //   sourcemap: true,
  //   external: ['@ainative/ai-kit-core', 'react', 'react-dom', 'recharts', '@tanstack/react-query', 'lucide-react'],
  //   treeshake: true,
  //   minify: false,
  //   esbuildOptions(options) {
  //     options.jsx = 'automatic';
  //   },
  // },
]);
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL1VzZXJzL2FpZGV2ZWxvcGVyL2FpLWtpdC9wYWNrYWdlcy9vYnNlcnZhYmlsaXR5L3RzdXAuY29uZmlnLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9Vc2Vycy9haWRldmVsb3Blci9haS1raXQvcGFja2FnZXMvb2JzZXJ2YWJpbGl0eVwiO2NvbnN0IF9faW5qZWN0ZWRfaW1wb3J0X21ldGFfdXJsX18gPSBcImZpbGU6Ly8vVXNlcnMvYWlkZXZlbG9wZXIvYWkta2l0L3BhY2thZ2VzL29ic2VydmFiaWxpdHkvdHN1cC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd0c3VwJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKFtcbiAgLy8gQ29yZSBidWlsZCAtIG5vbi1SZWFjdCBvYnNlcnZhYmlsaXR5IGZlYXR1cmVzXG4gIHtcbiAgICBlbnRyeTogWydzcmMvaW5kZXgudHMnXSxcbiAgICBmb3JtYXQ6IFsnZXNtJywgJ2NqcyddLFxuICAgIGR0czogdHJ1ZSxcbiAgICBzcGxpdHRpbmc6IGZhbHNlLFxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICBjbGVhbjogdHJ1ZSxcbiAgICBleHRlcm5hbDogWydAYWluYXRpdmUvYWkta2l0LWNvcmUnLCAncmVhY3QnLCAncmVjaGFydHMnXSxcbiAgICB0cmVlc2hha2U6IHRydWUsXG4gICAgbWluaWZ5OiBmYWxzZSxcbiAgfSxcbiAgLy8gUmVhY3QgY29tcG9uZW50cyBidWlsZCAtIFNraXAgZm9yIG5vdyBkdWUgdG8gbWlzc2luZyBVSSBkZXBlbmRlbmNpZXNcbiAgLy8gVE9ETzogRml4IFJlYWN0IGNvbXBvbmVudCBkZXBlbmRlbmNpZXMgb3IgY3JlYXRlIHByb3BlciBVSSBjb21wb25lbnRzXG4gIC8vIHtcbiAgLy8gICBlbnRyeTogWydzcmMvcmVhY3QvaW5kZXgudHN4J10sXG4gIC8vICAgZm9ybWF0OiBbJ2VzbScsICdjanMnXSxcbiAgLy8gICBkdHM6IHRydWUsXG4gIC8vICAgb3V0RGlyOiAnZGlzdC9yZWFjdCcsXG4gIC8vICAgc3BsaXR0aW5nOiBmYWxzZSxcbiAgLy8gICBzb3VyY2VtYXA6IHRydWUsXG4gIC8vICAgZXh0ZXJuYWw6IFsnQGFpbmF0aXZlL2FpLWtpdC1jb3JlJywgJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWNoYXJ0cycsICdAdGFuc3RhY2svcmVhY3QtcXVlcnknLCAnbHVjaWRlLXJlYWN0J10sXG4gIC8vICAgdHJlZXNoYWtlOiB0cnVlLFxuICAvLyAgIG1pbmlmeTogZmFsc2UsXG4gIC8vICAgZXNidWlsZE9wdGlvbnMob3B0aW9ucykge1xuICAvLyAgICAgb3B0aW9ucy5qc3ggPSAnYXV0b21hdGljJztcbiAgLy8gICB9LFxuICAvLyB9LFxuXSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThSLFNBQVMsb0JBQW9CO0FBRTNULElBQU8sc0JBQVEsYUFBYTtBQUFBO0FBQUEsRUFFMUI7QUFBQSxJQUNFLE9BQU8sQ0FBQyxjQUFjO0FBQUEsSUFDdEIsUUFBUSxDQUFDLE9BQU8sS0FBSztBQUFBLElBQ3JCLEtBQUs7QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLFdBQVc7QUFBQSxJQUNYLE9BQU87QUFBQSxJQUNQLFVBQVUsQ0FBQyx5QkFBeUIsU0FBUyxVQUFVO0FBQUEsSUFDdkQsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLEVBQ1Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQWlCRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
