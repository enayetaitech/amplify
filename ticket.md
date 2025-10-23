1. Observer sidebar mobile view need to fix.
2. Observer observation small screen sidebar open should be made false.
3. Meeting cannot be closed error need to fix.
4. ✅ FIXED - After clicking meeting end button it takes 2 min to end the meeting during that time user can do other things and observer stay at the backroom.
   - Root cause: Video processing (HLS to MP4 conversion) was blocking HTTP response
   - Solution: Moved deliverables processing to background, ongoing flag now set immediately
5. participant history show two entries but report ui is showing one.
6. Admin list should be renamed to internal admin list
7. after login super admin should not navigate to the project page
8.
