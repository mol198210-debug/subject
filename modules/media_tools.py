import yt_dlp

def get_video_info(url):
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True, 'no_warnings': True, 'skip_download': True
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get('title', 'Unknown')
            license_info = info.get('license', '')
            description = info.get('description', '').lower()
            status = '상업용 가능' if ('creative commons' in license_info.lower() or 'no copyright' in description) else '비상업용'
            return {'title': title, 'status': status, 'original_license': license_info}
    except Exception as e:
        raise Exception(str(e))
