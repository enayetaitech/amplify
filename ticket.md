1. ✅ FIXED - Observer sidebar mobile view need to fix.
   - Root cause: Observer sidebar used fixed col-span-3 without responsive mobile behavior
   - Solution: Added fixed overlay positioning for mobile with backdrop, responsive breakpoints
2. ✅ FIXED - Observer observation small screen sidebar open should be made false.
   - Solution: Sidebars now initialize closed on mobile (<768px), open on desktop (≥768px)
3. ✅ FIXED - Moderator right sidebar mobile view needs fixing
   - Root cause: Right sidebar (MainRightSidebar) used fixed col-span-3 without responsive behavior, missing toggle button
   - Solution: Added mobile overlay with backdrop, responsive positioning, and toggle button to reopen when closed
4. ✅ FIXED - When session is added to a new project (status changes from draft to active), sidebar doesn't update
   - Root cause: Cache invalidation was missing for project queries when sessions are created/deleted/edited
   - Solution: Added invalidation for ["project", projectId] and ["projectsByUser"] queries in all session mutations
5. ✅ FIXED - After clicking meeting end button it takes 2 min to end the meeting
   - Root cause: Video processing (HLS to MP4 conversion) was blocking HTTP response
   - Solution: Moved deliverables processing to background, ongoing flag now set immediately
6. ✅ FIXED - After login super admin/amplify admin should not navigate to the project page
   - Solution: SuperAdmin and AmplifyAdmin now redirect to their profile page (/my-profile/{userId}) instead of /projects
